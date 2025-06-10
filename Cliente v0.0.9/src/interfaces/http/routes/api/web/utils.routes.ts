import bcrypt from "bcryptjs";
// Importa los tipos necesarios de Express
import { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import { AuthService } from "@/application/services/auth/auth.service";
import { SecurityController } from "@/interfaces/http/controllers/admin/devs.controllers";
import { ReminderController } from "@/interfaces/http/controllers/asistent/reminder.controllers";
import { TaskController } from "@/interfaces/http/controllers/asistent/tasks.controllers";
import { LicenseController } from "@/interfaces/http/controllers/license/license.controllers";
import { main } from "@/main";
import { TRoutesInput } from "@/typings/utils";
import { config } from "@utils/config";
import { verified } from "@utils/token";

// Configuración de Multer para el almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Prioriza req.query.userId porque req.body aún no está disponible aquí
    const userId = req.query.userId || "unknown";
    const date = new Date().toISOString().split("T")[0];
    const uploadPath = path.join(
      __dirname,
      config.project.cdnpath
        ? config.project.cdnpath
        : "../../../../../../config/backups/cdn-client",
      `${date}_${userId}`,
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB límite
  },
});

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `/dashboard/utils/${path}`;
export default ({ app }: TRoutesInput) => {
  const taskController = new TaskController();
  const reminderController = new ReminderController();
  const controller = new LicenseController();
  const security = new SecurityController();

  /**
   * Endpoint para crear una nueva licencia.
   * Requiere autenticación y rol de administrador.
   */
  app.post(formatRoute("licenses/"), controller.create.bind(controller));

  /**
   * Endpoint para actualizar una licencia existente por su ID.
   * Requiere autenticación y rol de administrador.
   */
  app.put(formatRoute("licenses/:id"), controller.update.bind(controller));

  /**
   * Endpoint para eliminar una licencia existente por su ID.
   * Requiere autenticación y rol de administrador.
   */
  app.delete(formatRoute("licenses/:id"), controller.delete.bind(controller));

  // Rutas protegidas (solo autenticación)

  /**
   * Endpoint para obtener todas las licencias.
   * Requiere autenticación y rol de administrador.
   */
  app.get(formatRoute("licenses/"), controller.getAll.bind(controller));

  /**
   * Endpoint para obtener una licencia específica por su ID.
   * Requiere autenticación.
   */
  app.get(formatRoute("licenses/:id"), controller.getById.bind(controller));

  /**
   * Endpoint para obtener todas las licencias asociadas a un usuario específico.
   * Requiere autenticación.
   */
  app.get(formatRoute("licenses/user/:userId"), controller.getByUser.bind(controller));

  /**
   * Endpoint público para validar una licencia mediante su clave.
   * No requiere autenticación.
   */
  app.post(formatRoute("licenses/validate/:key"), controller.validate.bind(controller));

  /**
   * Obtiene información sobre una licencia específica.
   * Método: GET
   * Ruta: /api/v1/security/license-info/:licenseKey
   * Middleware: authenticateToken
   * Controlador: security.getLicenseInfo
   * Descripción: Devuelve información sobre una licencia utilizando su clave.
   */
  app.get(formatRoute("licenses/info/:licenseKey"), security.getLicenseInfo);

  /**
   * Crea una nueva tarea.
   * Método: POST
   * Ruta: /api/v1/service/tasks
   * Middleware: authenticateToken
   * Controlador: taskController.createTask
   * Descripción: Permite crear una nueva tarea.
   */
  app.post(formatRoute("tasks"), taskController.createTask.bind(taskController));

  /**
   * Obtiene una tarea específica por su ID.
   * Método: GET
   * Ruta: /api/v1/service/tasks/:id
   * Middleware: authenticateToken
   * Controlador: taskController.getTask
   * Descripción: Devuelve los detalles de una tarea específica.
   */
  app.get(formatRoute("tasks/:id"), taskController.getTask.bind(taskController));

  /**
   * Obtiene todas las tareas.
   * Método: GET
   * Ruta: /api/v1/service/tasks
   * Middleware: authenticateToken
   * Controlador: taskController.getAllTasks
   * Descripción: Devuelve una lista de todas las tareas.
   */
  app.get(formatRoute("tasks"), taskController.getAllTasks.bind(taskController));

  /**
   * Actualiza una tarea específica por su ID.
   * Método: PATCH
   * Ruta: /api/v1/service/tasks/:id
   * Middleware: authenticateToken
   * Controlador: taskController.updateTask
   * Descripción: Permite actualizar los detalles de una tarea específica.
   */
  app.patch(formatRoute("tasks/:id"), taskController.updateTask.bind(taskController));

  /**
   * Elimina una tarea específica por su ID.
   * Método: DELETE
   * Ruta: /api/v1/service/tasks/:id
   * Middleware: authenticateToken
   * Controlador: taskController.deleteTask
   * Descripción: Permite eliminar una tarea específica.
   */
  app.delete(formatRoute("tasks/:id"), taskController.deleteTask.bind(taskController));

  /**
   * Obtiene recordatorios próximos.
   * Método: GET
   * Ruta: /reminders
   * Middleware: authenticateToken
   * Controlador: reminderController.getUpcomingReminders
   * Descripción: Devuelve una lista de recordatorios próximos.
   */
  app.get("reminders", reminderController.getUpcomingReminders.bind(reminderController));

  app.post(formatRoute("cdn"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Verificar campos requeridos
      if (!req.body.userId || !req.body.title) {
        // Eliminar el archivo subido si faltan campos requeridos
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "userId and title are required fields",
        });
      }

      // Obtener metadatos del archivo
      const fileMetadata = {
        userId: req.body.userId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        title: req.body.title,
        description: req.body.description || "",
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.body.userId,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        downloadUrl: `/dashboard/utils/cdn/download/${req.body.userId}/${req.file.filename}`,
      };

      await main.prisma.fileMetadata.create({
        data: {
          userId: fileMetadata.userId,
          originalName: fileMetadata.originalName,
          fileName: fileMetadata.fileName,
          title: fileMetadata.title,
          description: fileMetadata.description,
          uploadedAt: new Date(fileMetadata.uploadedAt),
          uploadedBy: fileMetadata.uploadedBy,
          path: fileMetadata.path,
          size: fileMetadata.size,
          mimeType: fileMetadata.mimeType,
          downloadUrl: fileMetadata.downloadUrl,
        },
      });

      // Aquí deberías guardar los metadatos en tu base de datos
      // Ejemplo: await FileModel.create(fileMetadata);

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: fileMetadata,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);

      // Eliminar el archivo si hubo un error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  });

  app.get(formatRoute("cdn/download/:userId/:fileName"), async (req: Request, res: Response) => {
    const { userId, fileName } = req.params;

    try {
      // Verificar que el usuario y el archivo existan
      const fileMetadata = await main.prisma.fileMetadata.findFirst({
        where: {
          userId: userId,
          fileName: fileName,
        },
      });

      if (!fileMetadata) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Enviar el archivo al cliente
      res.removeHeader("X-Frame-Options");
      res.download(fileMetadata.path, fileMetadata.originalName);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
    return;
  });

  app.get(formatRoute("cdn/:userId"), async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      // Obtener todos los archivos del usuario
      const files = await main.prisma.fileMetadata.findMany({
        where: {
          userId: userId,
        },
      });

      return res.status(200).json({
        success: true,
        data: files,
      });
    } catch (error: any) {
      console.error("Error fetching files:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  });

  app.delete(formatRoute("cdn/:userId/:fileName"), async (req: Request, res: Response) => {
    const { userId, fileName } = req.params;

    try {
      // Verificar que el usuario y el archivo existan
      const fileMetadata = await main.prisma.fileMetadata.findFirst({
        where: {
          userId: userId,
          fileName: fileName,
        },
      });

      if (!fileMetadata) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Eliminar el archivo del sistema de archivos
      if (fs.existsSync(fileMetadata.path)) {
        fs.unlinkSync(fileMetadata.path);
      }

      // Eliminar los metadatos del archivo de la base de datos
      await main.prisma.fileMetadata.delete({
        where: {
          id: fileMetadata.id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  });

  app.get(formatRoute("cdn/view/:userId/:fileName"), async (req: Request, res: Response) => {
    const { userId, fileName } = req.params;
    console.log(req.params);

    // Buscar metadatos del archivo
    const fileMetadata = await main.prisma.fileMetadata.findFirst({
      where: {
        userId: userId,
        fileName: fileName,
      },
    });

    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: "File not savee in the database",
      });
    }

    // Usa la ruta guardada en la base de datos
    const filePath = fileMetadata.path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found path",
      });
    }

    res.type(fileMetadata.mimeType);
    return res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error sending file",
          error: err.message,
        });
      }

      return;
    });
  });

  /*   app.get(formatRoute("cdn/share"), async (req: Request, res: Response) => {
    const { fileId, expiresAt, maxDownloads, password } = req.body;
    const url = hostURL() + `/dashboard/cdn/share/${fileId}`;
    const link = await main.prisma.sharedLinkCDN.create({
      data: {
        fileId,
        url,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxDownloads: maxDownloads ? Number(maxDownloads) : null,
        password: password ? password : null,
      },
    });
    res.json({ success: true, url: link.url });
  }); */

  app.post(formatRoute("auth/register"), async (req: Request, res: Response) => {
    try {
      const auth = new AuthService();

      const userData = req.body;
      const user = req.user;
      const result = await auth.createAuth(userData);

      if ("error" in result) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: "Error creating user",
        });
      }

      req.login(user, (err) => {
        if (err) {
          // Manejar error
          return res.status(500).json({ success: false, message: "Error de sesión" });
        }
        // Usuario guardado en sesión, igual que con Discord
        return res.json({ success: true, user });
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: req.t("errors.server_error"),
      });
    }

    return;
  });

  app.post(formatRoute("auth/login"), async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const user = await main.prisma.userAPI.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).render("authme.ejs", { title: "Nebura" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).render("authme.ejs", { title: "Nebura" });
      }
      // Guardar usuario en sesión
      req.login(user, (err) => {
        if (err) return res.status(500).render("authme.ejs", { title: "Nebura" });
        return res.redirect("/dashboard"); // O donde quieras redirigir
      });
    } catch (err) {
      return res.status(500).render("authme.ejs", { title: "Nebura" });
    }
  });

  app.post(formatRoute("admin/register"), async (req: Request, res: Response) => {
    try {
      const allowedRoles = ["admin", "developer", "owner"];
      const auth = new AuthService();

      const userData = req.body;
      const result = await auth.createAuth(userData);

      if ("error" in result) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: "Error creating user",
        });
      }

      const dataUser = await main.prisma.userAPI.findUnique({
        where: { email: userData.email },
      });

      if (!dataUser || !allowedRoles.includes(dataUser.role)) {
        return res.status(404).json({
          success: false,
          message: "User not found or not authorized",
        });
      }

      return res.status(201).json({ success: true, user: result });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  });

  app.post(formatRoute("admin/login"), async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const user = await main.prisma.userAPI.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
      const valid = await verified(password, user.password);
      if (!valid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const allowedRoles = ["admin", "developer", "owner"];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "User not authorized",
        });
      }

      // Guardar usuario en sesión
      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
        error: err.message || "Internal server error",
      });
    }
  });

  app.put(formatRoute("auth/update"), async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;

      // Verificar que el usuario exista
      const user = await main.prisma.userAPI.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Actualizar el usuario
      const updatedUser = await main.prisma.userAPI.update({
        where: { id: userId },
        data: {
          role: role || user.role, // Mantener el rol actual si no se proporciona uno nuevo
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  });
};
