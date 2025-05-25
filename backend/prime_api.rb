require 'sinatra'
require 'securerandom'
require 'openssl'
require 'json'

# --- PRIME NUMBER GAME (modulo 4) ---
ROOMS_PRIME = {}
MAX_ROOMS_PRIME = 200

def cleanup_rooms_prime!
  if ROOMS_PRIME.size >= MAX_ROOMS_PRIME
    to_delete = ROOMS_PRIME.sort_by { |_, v| v[:created_at] }.first(ROOMS_PRIME.size - (MAX_ROOMS_PRIME - 1))
    to_delete.each { |room_id, _| ROOMS_PRIME.delete(room_id) }
  end
end

def generate_prime_mod4(bits, mod)
  loop do
    p = OpenSSL::BN.generate_prime(bits).to_i
    return p if p % 4 == mod
  end
end

# POST /api/prime/start – start gry
post '/api/prime/start' do
  cleanup_rooms_prime!
  room_id = SecureRandom.hex(5)
  ROOMS_PRIME[room_id] = {
    p: nil, q: nil, n: nil, mod: nil, guess: nil, revealed: false, result: nil, created_at: Time.now, setter_id: nil
  }
  content_type :json
  {room_id: room_id}.to_json
end

# POST /api/prime/generate_primes – generuje i zwraca losowe p, q (nie zapisuje do pokoju)
post '/api/prime/generate_primes' do
  bits = 64 # Możesz zwiększyć do 128/256 dla większego bezpieczeństwa
  mod = [1, 3].sample
  p = generate_prime_mod4(bits, mod)
  puts "P: #{p}"
  q = generate_prime_mod4(bits, mod)
  puts "Q: #{q}"
  n = p * q
  puts "N: #{n}"
  content_type :json
  {p: p, q: q, n: n}.to_json
end

# POST /api/prime/:room_id/guess – przyjmuje zgadywanie (1 lub 3)
post '/api/prime/:room_id/guess' do
  data = JSON.parse(request.body.read)
  guess = data['guess'].to_i
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  halt 400, {error: 'Already guessed'}.to_json if room[:guess]
  halt 400, {error: 'Invalid guess'}.to_json unless [1,3].include?(guess)
  room[:guess] = guess
  {ok: true}.to_json
end

# POST /api/prime/:room_id/reveal – ujawnia p, q, sprawdza czy B zgadł
post '/api/prime/:room_id/reveal' do
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  halt 400, {error: 'No guess yet'}.to_json unless room[:guess]
  halt 400, {error: 'Already revealed'}.to_json if room[:revealed]
  room[:revealed] = true
  correct = (room[:mod] == room[:guess])
  room[:result] = correct
  {p: room[:p], q: room[:q], n: room[:n], mod: room[:mod], guess: room[:guess], correct: correct}.to_json
end

# POST /api/prime/:room_id/set_primes – ustawia liczby pierwsze p i q w pokoju
post '/api/prime/:room_id/set_primes' do
  data = JSON.parse(request.body.read)
  p = data['p'].to_i
  q = data['q'].to_i
  setter_id = data['setter_id']
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  room[:p] = p
  room[:q] = q
  room[:n] = p * q
  room[:setter_id] = setter_id
  content_type :json
  {ok: true, n: room[:n]}.to_json
end

# GET /api/prime/:room_id/status – zwraca stan gry (zawsze p, q, n jeśli są ustawione)
get '/api/prime/:room_id/status' do
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  {
    n: room[:n],
    guess: room[:guess],
    revealed: room[:revealed],
    result: room[:result],
    p: room[:p],
    q: room[:q],
    setter_id: room[:setter_id],
    mod: (room[:revealed] ? room[:mod] : nil)
  }.to_json
end

# GET /api/prime/:room_id/verify – sprawdza czy p, q są pierwsze i N = p*q
get '/api/prime/:room_id/verify' do
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  halt 400, {error: 'Not revealed yet'}.to_json unless room[:revealed]
  p = room[:p]
  q = room[:q]
  n = room[:n]
  require 'prime'
  is_p_prime = Prime.prime?(p)
  is_q_prime = Prime.prime?(q)
  n_ok = (p * q == n)
  {p: p, q: q, n: n, is_p_prime: is_p_prime, is_q_prime: is_q_prime, n_ok: n_ok}.to_json
end

# POST /api/prime/:room_id/claim_setter – atomowo ustawia setter_id jeśli nie jest ustawione
post '/api/prime/:room_id/claim_setter' do
  data = JSON.parse(request.body.read)
  player_id = data['player_id']
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  if room[:setter_id].nil?
    room[:setter_id] = player_id
    is_setter = true
  else
    is_setter = (room[:setter_id] == player_id)
  end
  content_type :json
  {ok: true, is_setter: is_setter, setter_id: room[:setter_id]}.to_json
end 
