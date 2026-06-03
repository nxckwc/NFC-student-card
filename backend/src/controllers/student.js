import { prisma } from "../lib/prisma.js";

/**
 * @swagger
 * /student:
 *   post:
 *     summary: Create new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: García
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Missing data about student
 *       500:
 *         description: Internal error
 */
export const createStudent = async (req, res) => {
	try {
		const { firstName, lastName } = req.body;

		if (!firstName || !lastName ) return res.status(400).json({ error: 'Missing data about student'})
		const student = await prisma.student.create({
			data: {
				firstName, 
				lastName
			}
		})
		res.status(201).json(student)
	} catch (error) {
		res.status(500).json({ error: 'Internal error' })
	}
}

/**
 * @swagger
 * /student/{studentId}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student UUID
 *     responses:
 *       200:
 *         description: Student found
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal error
 */
export const getStudent = async (req, res) => {
	try {
		const { studentId } = req.params;

		const student = await prisma.student.findUnique({
			where: { id: studentId }
		})
		if (!student) return res.status(404).json({ error: 'Student not found'})
		res.json(student)
	} catch (error) {
		res.status(500).json({ error: 'Internal error' })
	}
}

/**
 * @swagger
 * /student/card/{studentCardId}:
 *   get:
 *     summary: Get student by NFC card ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentCardId
 *         required: true
 *         schema:
 *           type: string
 *         description: NFC card UUID
 *     responses:
 *       200:
 *         description: Student found
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal error
 */
export const getStudentByCard = async (req, res) => {
		try {
		const { studentCardId } = req.params;

		const student = await prisma.student.findUnique({
			where: { uid_card: studentCardId }
		})
		if (!student) return res.status(404).json({ error: 'Student not found'})
		res.json(student)
	} catch (error) {
		res.status(500).json({ error: 'Internal error' })
	}
}