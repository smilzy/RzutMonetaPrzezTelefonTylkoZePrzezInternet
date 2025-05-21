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

# POST /api/prime/start – start gry, zwraca room_id i N
post '/api/prime/start' do
  cleanup_rooms_prime!
  bits = 64 # Możesz zwiększyć do 128/256 dla większego bezpieczeństwa
  mod = [1, 3].sample
  p = generate_prime_mod4(bits, mod)
  q = generate_prime_mod4(bits, mod)
  n = p * q
  room_id = SecureRandom.hex(5)
  ROOMS_PRIME[room_id] = {
    p: p, q: q, n: n, mod: mod, guess: nil, revealed: false, result: nil, created_at: Time.now
  }
  content_type :json
  {room_id: room_id, n: n}.to_json
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

# GET /api/prime/:room_id/status – zwraca stan gry
get '/api/prime/:room_id/status' do
  room = ROOMS_PRIME[params[:room_id]]
  halt 404, {error: 'Room not found'}.to_json unless room
  {
    n: room[:n],
    guess: room[:guess],
    revealed: room[:revealed],
    result: room[:result],
    p: (room[:revealed] ? room[:p] : nil),
    q: (room[:revealed] ? room[:q] : nil),
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
