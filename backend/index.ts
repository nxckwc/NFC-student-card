import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import cors from 'cors'
import { login, logout, register, session, updateProfile } from './src/controllers/auth.js'
import 'dotenv/config'
import { createStudent, getStudent, getStudentByCard, registerCard } from './src/controllers/student.js'
import { getSchedule } from './src/controllers/schedule.js'
import { createReader, deleteAccount, deleteStudent, getAccount, getAccounts, getAdminOverview, getAttendance, getReaders, getSchoolSettings, getStudents, replaceAccountSchedule, updateAccountRole, updateReader, updateSchoolSettings, updateStudent } from './src/controllers/admin.js'
import { lookupCard, scanReader } from './src/controllers/reader.js'
import { getNamelist, namelistEvents, setStudentStatus } from './src/controllers/namelist.js'
import { getReportStudents, getStudentReport } from './src/controllers/analytics.js'

const app = express()
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

// Swagger
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Nack API',
            version: '1.0.0',
            description: 'Documentation for Nack :D',
        },
        servers: [
            { url: `http://localhost:${port}` }
        ],
        components: {
            securitySchemes: {
                deviceToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Device-Token'
                }
            }
        },
    },
    apis: ['./*.ts', './src/controllers/*.ts']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

app.use(express.json())

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

/**
 * @swagger
 * /:
 *  get:
 *      summary: Just test endpoint! Hello world!
 *      responses:
 *          200:
 *              description: Everything fine
 */
app.get('/', (_req, res) => {
  res.send('Hello World! Access /api-docs to see API documentation')
})

app.post('/auth/register', register)
app.post('/auth/login', login)
app.get('/auth/session', session)
app.patch('/auth/profile', updateProfile)
app.post('/auth/logout', logout)

app.get('/analytics/students', getReportStudents)
app.get('/analytics/reports/student/:studentId', getStudentReport)
app.get('/analytics/reports/student/:studentId/:format', getStudentReport)

app.get('/dashboard/schedule', getSchedule)
app.get('/dashboard/namelist/:entryId', getNamelist)
app.patch('/dashboard/namelist/:entryId/students/:studentId', setStudentStatus)
app.get('/dashboard/namelist/:entryId/events', namelistEvents)
app.get('/admin/overview', getAdminOverview)
app.get('/admin/accounts', getAccounts)
app.get('/admin/accounts/:accountId', getAccount)
app.put('/admin/accounts/:accountId/schedule', replaceAccountSchedule)
app.patch('/admin/accounts/:accountId/role', updateAccountRole)
app.delete('/admin/accounts/:accountId', deleteAccount)
app.get('/admin/students', getStudents)
app.patch('/admin/students/:studentId', updateStudent)
app.delete('/admin/students/:studentId', deleteStudent)
app.get('/admin/attendance', getAttendance)
app.get('/admin/readers', getReaders)
app.post('/admin/readers', createReader)
app.patch('/admin/readers/:readerId', updateReader)
app.get('/admin/settings', getSchoolSettings)
app.put('/admin/settings', updateSchoolSettings)
app.post('/admin/reader/scan', scanReader)
app.get('/admin/reader/lookup', lookupCard)

app.post('/student', createStudent)
app.post('/card/register', registerCard)
app.get('/student/card/:studentCardId', getStudentByCard)
app.get('/student/:studentId', getStudent)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
