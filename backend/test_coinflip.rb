require 'minitest/autorun'
require 'digest'

def commitment(bit, nonce)
  Digest::SHA256.hexdigest("#{bit}:#{nonce}")
end

class CoinFlipTest < Minitest::Test
  def test_commitment_and_reveal
    # Gracz 1
    bit1 = rand(2)
    nonce1 = 'abc123'
    comm1 = commitment(bit1, nonce1)
    # Gracz 2
    bit2 = rand(2)
    nonce2 = 'xyz789'
    comm2 = commitment(bit2, nonce2)

    # Commitmenty trafiają do "serwera"
    commitments = {p1: comm1, p2: comm2}

    # Ujawnienie bitów i nonce
    reveals = {p1: {bit: bit1, nonce: nonce1}, p2: {bit: bit2, nonce: nonce2}}

    # Weryfikacja commitmentów
    assert_equal commitments[:p1], commitment(reveals[:p1][:bit], reveals[:p1][:nonce])
    assert_equal commitments[:p2], commitment(reveals[:p2][:bit], reveals[:p2][:nonce])

    # Wynik XOR
    result = reveals[:p1][:bit] ^ reveals[:p2][:bit]
    assert_includes [0,1], result
  end
end 
