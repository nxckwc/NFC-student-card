import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: hadi
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: hadi
 *       400:
 *         description: Username already taken
 */
export const register = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) return res.status(400).json({message: 'Username and password are required'})

  if (password.length < 6) return res.status(400).json({message: 'Password must be at least 6 characters'})

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return res.status(400).json({ message: 'Username already taken' })

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { username, password: hashed }
  })

  res.json({ id: user.id, username: user.username })
}


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: hadi
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) return res.status(400).json({message: 'Username and password are required'})

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  res.json({ token })
}