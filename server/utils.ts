import crypto from 'crypto'

/**
 * Génère un mot de passe sécurisé
 * @returns {string} Mot de passe généré
 */
export function generatePassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''

  // S'assurer d'avoir au moins un caractère de chaque type
  password += getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ') // Majuscule
  password += getRandomChar('abcdefghijklmnopqrstuvwxyz') // Minuscule
  password += getRandomChar('0123456789') // Chiffre
  password += getRandomChar('!@#$%^&*') // Caractère spécial

  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[crypto.randomInt(charset.length)]
  }

  // Mélanger le mot de passe
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

/**
 * Retourne un caractère aléatoire d'une chaîne donnée
 * @param {string} str Chaîne de caractères source
 * @returns {string} Caractère aléatoire
 */
function getRandomChar(str: string): string {
  return str[crypto.randomInt(str.length)]
} 