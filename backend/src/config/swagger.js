const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bahari CBO IoT API',
      version: '1.0.0',
      description:
        'REST API for Bahari CBO temperature monitoring system. Monitors fish cages and seaweed farms.',
      contact: {
        name: 'Bahari CBO',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        deviceApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-device-key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'monitor'] },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Device: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            deviceId: { type: 'string' },
            type: { type: 'string', enum: ['fish_cage', 'seaweed_farm'] },
            location: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'maintenance'] },
          },
        },
        Reading: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            device: { type: 'string' },
            temperature: { type: 'number' },
            unit: { type: 'string', enum: ['C', 'F'] },
            timestamp: { type: 'string', format: 'date-time' },
            alert: { type: 'boolean' },
          },
        },
        Location: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['fish_cage', 'seaweed_farm'] },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
            description: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
