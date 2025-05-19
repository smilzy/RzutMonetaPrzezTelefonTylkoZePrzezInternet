require 'sinatra'
require 'json'
require 'securerandom'
require 'digest'

set :bind, '0.0.0.0'
set :port, 4567

# Prosta "baza" w pamięci (hash: room_id => {commitments, reveals})
ROOMS = {}
MAX_ROOMS = 1000

# Helper: usuń najstarsze pokoje, jeśli przekroczono limit
def cleanup_rooms!
  if ROOMS.size >= MAX_ROOMS
    to_delete = ROOMS.sort_by { |_, v| v[:created_at] }.first(ROOMS.size - (MAX_ROOMS - 1))
    to_delete.each { |room_id, _| ROOMS.delete(room_id) }
  end
end

# Strona główna (statyczny frontend)
get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

# Utwórz nowy pokój
post '/api/create_room' do
  cleanup_rooms!
  room_id = SecureRandom.hex(4)
  ROOMS[room_id] = {commitments: {}, reveals: {}, created_at: Time.now}
  {room_id: room_id}.to_json
end

# Zapisz commitment gracza
post '/api/:room_id/commit' do
  data = JSON.parse(request.body.read)
  player = data['player']
  commitment = data['commitment']
  ROOMS[params[:room_id]][:commitments][player] = commitment
  {ok: true}.to_json
end

# Pobierz commitmenty
get '/api/:room_id/commitments' do
  room = ROOMS[params[:room_id]]
  {commitments: room[:commitments]}.to_json
end

# Zapisz reveal gracza
post '/api/:room_id/reveal' do
  data = JSON.parse(request.body.read)
  player = data['player']
  bit = data['bit']
  nonce = data['nonce']
  ROOMS[params[:room_id]][:reveals][player] = {bit: bit, nonce: nonce}
  {ok: true}.to_json
end

# Pobierz reveals
get '/api/:room_id/reveals' do
  room = ROOMS[params[:room_id]]
  {reveals: room[:reveals]}.to_json
end

# Oblicz wynik (XOR bitów)
get '/api/:room_id/result' do
  room = ROOMS[params[:room_id]]
  reveals = room[:reveals]
  if reveals.keys.size == 2
    bits = reveals.values.map { |r| r[:bit].to_i }
    result = bits.reduce(:^) # XOR
    {result: result, meaning: result == 0 ? 'orzeł' : 'reszka'}.to_json
  else
    status 400
    {error: 'Not enough reveals'}.to_json
  end
end

# Dodaj pole guesses do pokoju
post '/api/:room_id/guess' do
  data = JSON.parse(request.body.read)
  player = data['player']
  guess = data['guess']
  room = ROOMS[params[:room_id]]
  room[:guesses] ||= {}
  room[:guess_times] ||= {}
  room[:guesses][player] = guess
  room[:guess_times][player] = Time.now.to_f
  {ok: true}.to_json
end

get '/api/:room_id/guesses' do
  room = ROOMS[params[:room_id]]
  guesses = room[:guesses] || {}
  {guesses: guesses}.to_json
end

# Wynik zgadywania: zwraca wynik, gdy obaj zgadli lub minął czas (10s od pierwszego zgadnięcia)
get '/api/:room_id/guess_result' do
  room = ROOMS[params[:room_id]]
  guesses = room[:guesses] || {}
  guess_times = room[:guess_times] || {}
  reveals = room[:reveals]
  # Sprawdź czy są oba zgadywania lub timeout
  if reveals.keys.size == 2
    if guesses.keys.size == 2
      ready = true
    elsif guess_times.values.min && (Time.now.to_f - guess_times.values.min > 10)
      ready = true
    else
      ready = false
    end
    if ready
      bits = reveals.values.map { |r| r[:bit].to_i }
      result = bits.reduce(:^)
      {result: result, meaning: result == 0 ? 'orzeł' : 'reszka', guesses: guesses}.to_json
    else
      status 202
      {waiting: true, guesses: guesses}.to_json
    end
  else
    status 400
    {error: 'Not enough reveals'}.to_json
  end
end 
