import crypto from 'crypto'

const KEY = '7k9m2n8q4r6t1u3w5y7z9a2c4e6g8h0j'

export function encrypt(string: string) {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
    let encrypted = cipher.update(string, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error in encrypt:', error)
    return ''
  }
}

export function decrypt(string: string) {
  try {
    const parts = string.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Error in decrypt:', error)
    return ''
  }
}
