# Event App Backend

Backend para una aplicación de gestión de eventos, actividades y asistentes.

## Tecnologías Utilizadas

- **Node.js** y **Express.js** para el servidor
- **MongoDB** con **Mongoose** para la base de datos
- **JWT** para autenticación
- **Cloudinary** para almacenamiento de archivos
- **Multer** para manejo de subida de archivos
- **Bcrypt** para encriptación de contraseñas

## Requisitos

- Node.js (v14.0.0 o superior)
- MongoDB
- Cuenta en Cloudinary (para almacenamiento de archivos)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/event-app-backend.git
   cd event-app-backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edita el archivo `.env` con tus propias variables:
   ```env
   PORT=5000
   MONGO_URI=tu_url_de_mongodb
   JWT_SECRET=tu_secreto_jwt
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```

## Uso

### Desarrollo

Para ejecutar en modo desarrollo con recarga automática:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`.

### Producción

Para ejecutar en modo producción:

```bash
npm start
```

## Endpoints API

La API proporciona los siguientes endpoints:

### Usuarios

- `POST /api/users` - Registrar un nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users/profile` - Obtener perfil del usuario actual
- `PUT /api/users/profile` - Actualizar perfil del usuario actual
- `GET /api/users` - Obtener todos los usuarios (admin)
- `GET /api/users/:id` - Obtener un usuario por ID (admin)
- `PUT /api/users/:id` - Actualizar un usuario (admin)
- `DELETE /api/users/:id` - Eliminar un usuario (admin)

### Eventos

- `GET /api/events` - Obtener todos los eventos
- `POST /api/events` - Crear un nuevo evento (admin)
- `GET /api/events/:id` - Obtener un evento por ID
- `PUT /api/events/:id` - Actualizar un evento (admin/operador)
- `DELETE /api/events/:id` - Eliminar un evento (admin)
- `POST /api/events/:id/logo` - Subir logo para un evento (admin/operador)
- `POST /api/events/:id/mainImage` - Subir imagen principal (admin/operador)
- `POST /api/events/:id/photos` - Subir fotos para un evento (admin/operador/asistente)
- `POST /api/events/:id/operators` - Agregar operador a un evento (admin)
- `DELETE /api/events/:id/operators/:userId` - Eliminar operador (admin)
- `POST /api/events/:id/assistants` - Agregar asistente a un evento (admin/operador)
- `DELETE /api/events/:id/assistants/:userId` - Eliminar asistente (admin/operador)

### Actividades

- `GET /api/events/:eventId/activities` - Obtener actividades de un evento
- `POST /api/events/:eventId/activities` - Crear actividad (admin/operador)
- `GET /api/activities/:id` - Obtener una actividad por ID
- `PUT /api/activities/:id` - Actualizar una actividad (admin/operador)
- `DELETE /api/activities/:id` - Eliminar una actividad (admin)
- `POST /api/activities/:id/witnesses` - Agregar testigo (admin/operador)
- `DELETE /api/activities/:id/witnesses/:userId` - Eliminar testigo (admin/operador)
- `PUT /api/activities/:id/seats/increment` - Incrementar asientos ocupados
- `PUT /api/activities/:id/seats/decrement` - Decrementar asientos ocupados

### Tickets

- `GET /api/tickets` - Obtener todos los tickets (admin/operador)
- `POST /api/tickets` - Crear un nuevo ticket (admin/operador)
- `GET /api/tickets/:id` - Obtener un ticket por ID
- `PUT /api/tickets/:id` - Actualizar un ticket (admin/operador)
- `DELETE /api/tickets/:id` - Eliminar un ticket (admin)
- `GET /api/tickets/user/:userId` - Obtener tickets de un usuario
- `GET /api/tickets/event/:eventId` - Obtener tickets de un evento (admin/operador)

### Calificaciones

- `POST /api/califications` - Crear una calificación (usuario autenticado)
- `GET /api/califications/:id` - Obtener una calificación por ID
- `PUT /api/califications/:id` - Actualizar una calificación (propietario/admin)
- `DELETE /api/califications/:id` - Eliminar una calificación (propietario/admin)
- `GET /api/califications/:targetModel/:targetId` - Obtener calificaciones por objetivo

### Testigos

- `GET /api/witnesses` - Obtener todos los testigos (admin)
- `POST /api/witnesses` - Crear un nuevo testigo (admin/operador)
- `DELETE /api/witnesses/:id` - Eliminar un testigo (admin/operador)
- `GET /api/witnesses/:targetModel/:targetId` - Obtener testigos por objetivo (admin/operador)
- `GET /api/witnesses/user/:userId` - Obtener testigos por usuario

### Archivos

- `GET /api/files` - Obtener todos los archivos (admin)
- `POST /api/files` - Subir un archivo
- `GET /api/files/:id` - Obtener un archivo por ID
- `PUT /api/files/:id` - Actualizar información de un archivo (propietario/admin)
- `DELETE /api/files/:id` - Eliminar un archivo (propietario/admin)
- `GET /api/files/owner/:userId` - Obtener archivos por propietario
- `GET /api/files/target/:targetModel/:targetId` - Obtener archivos por objetivo

### Configuración Principal

- `GET /api/main` - Obtener configuración de la aplicación
- `PUT /api/main` - Actualizar configuración de la aplicación (admin)
- `POST /api/main/logo` - Subir logo de la aplicación (admin)

## Modelos de Datos

El sistema utiliza los siguientes modelos principales:

- **User**: Gestión de usuarios y autenticación
- **Event**: Eventos principales
- **Activity**: Actividades dentro de eventos
- **Ticket**: Tickets de acceso para usuarios
- **Calification**: Calificaciones para eventos y actividades
- **Witness**: Registro de asistencia a eventos y actividades
- **File**: Gestión de archivos (fotos, documentos, etc.)
- **Main**: Configuración global de la aplicación

## Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Despliegue

El backend está diseñado para ser desplegado en Render. Sigue estos pasos para desplegar:

1. Crea una cuenta en [Render](https://render.com/)
2. Crea un nuevo servicio web vinculado a tu repositorio
3. Configura las variables de entorno según el archivo `.env.example`
4. Configura el comando de inicio: `npm start`
5. ¡Listo! Tu backend estará disponible en la URL proporcionada por Render