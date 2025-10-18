"""
Telegram Bot para controlar presentaciones remotamente.
El bot permite a los usuarios autorizados controlar las diapositivas
mediante comandos de Telegram.
"""
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

logger = logging.getLogger(__name__)


class TelegramBot:
    """Bot de Telegram para control de presentaciones."""

    def __init__(self, token: str, socketio_instance, class_store, control_action_func):
        """
        Inicializa el bot de Telegram.
        
        Args:
            token: Token del bot de Telegram (obtener de @BotFather)
            socketio_instance: Instancia de SocketIO para emitir eventos
            class_store: Instancia de ClassStore para acceder a las clases
            control_action_func: Función para procesar acciones de control (next, prev, goto)
        """
        self.token = token
        self.socketio = socketio_instance
        self.store = class_store
        self.control_action = control_action_func
        self.application = None
        self.active_classes = {}  # {chat_id: class_id}

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /start - Muestra mensaje de bienvenida."""
        welcome_text = (
            "🎓 *Bienvenido al Asistente de Clase IA*\n\n"
            "Usa los siguientes comandos:\n"
            "/list - Ver clases disponibles\n"
            "/select <ID> - Seleccionar una clase\n"
            "/next - Siguiente diapositiva\n"
            "/prev - Diapositiva anterior\n"
            "/goto <N> - Ir a diapositiva N\n"
            "/status - Ver estado actual\n"
        )
        await update.message.reply_text(welcome_text, parse_mode="Markdown")

    async def list_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /list - Lista todas las clases disponibles."""
        classes = self.store.list_classes()
        
        if not classes:
            await update.message.reply_text("No hay clases disponibles.")
            return

        response = "📚 *Clases disponibles:*\n\n"
        for cls in classes:
            status_emoji = "🟢" if cls.get("status") == "live" else "⚪"
            response += (
                f"{status_emoji} *{cls['title']}*\n"
                f"  ID: `{cls['id']}`\n"
                f"  Estado: {cls.get('status', 'ready')}\n"
                f"  Diapositivas: {cls.get('total_slides', 0)}\n\n"
            )
        
        await update.message.reply_text(response, parse_mode="Markdown")

    async def select_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /select - Selecciona una clase para controlar."""
        if not context.args:
            await update.message.reply_text("Uso: /select <class_id>")
            return

        class_id = context.args[0]
        class_data = self.store.get_class(class_id)
        
        if not class_data:
            await update.message.reply_text("❌ Clase no encontrada.")
            return

        chat_id = update.effective_chat.id
        self.active_classes[chat_id] = class_id
        
        # Crear teclado inline con controles
        keyboard = [
            [
                InlineKeyboardButton("⬅️ Anterior", callback_data=f"prev_{class_id}"),
                InlineKeyboardButton("➡️ Siguiente", callback_data=f"next_{class_id}"),
            ],
            [
                InlineKeyboardButton("ℹ️ Estado", callback_data=f"status_{class_id}"),
            ],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"✅ Clase seleccionada: *{class_data['title']}*\n"
            f"Diapositiva actual: {class_data.get('current_slide', 0)}/{class_data.get('total_slides', 0)}",
            parse_mode="Markdown",
            reply_markup=reply_markup,
        )

    async def next_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /next - Avanza a la siguiente diapositiva."""
        chat_id = update.effective_chat.id
        class_id = self.active_classes.get(chat_id)
        
        if not class_id:
            await update.message.reply_text("⚠️ Primero selecciona una clase con /select <ID>")
            return

        # Procesar acción de control directamente
        updated = self.control_action(class_id, "next")
        
        if updated:
            await update.message.reply_text(
                f"➡️ Siguiente diapositiva\n"
                f"Actual: {updated.get('current_slide', 0)}/{updated.get('total_slides', 0)}"
            )
        else:
            await update.message.reply_text("❌ Error al avanzar diapositiva")

    async def prev_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /prev - Retrocede a la diapositiva anterior."""
        chat_id = update.effective_chat.id
        class_id = self.active_classes.get(chat_id)
        
        if not class_id:
            await update.message.reply_text("⚠️ Primero selecciona una clase con /select <ID>")
            return

        # Procesar acción de control directamente
        updated = self.control_action(class_id, "prev")
        
        if updated:
            await update.message.reply_text(
                f"⬅️ Diapositiva anterior\n"
                f"Actual: {updated.get('current_slide', 0)}/{updated.get('total_slides', 0)}"
            )
        else:
            await update.message.reply_text("❌ Error al retroceder diapositiva")

    async def goto_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /goto - Va a una diapositiva específica."""
        chat_id = update.effective_chat.id
        class_id = self.active_classes.get(chat_id)
        
        if not class_id:
            await update.message.reply_text("⚠️ Primero selecciona una clase con /select <ID>")
            return

        if not context.args:
            await update.message.reply_text("Uso: /goto <número_diapositiva>")
            return

        try:
            slide_number = int(context.args[0])
        except ValueError:
            await update.message.reply_text("❌ El número de diapositiva debe ser un entero.")
            return

        # Procesar acción de control directamente
        updated = self.control_action(class_id, "goto", slide_number)
        
        if updated:
            await update.message.reply_text(
                f"🎯 Ir a diapositiva {slide_number}\n"
                f"Actual: {updated.get('current_slide', 0)}/{updated.get('total_slides', 0)}"
            )
        else:
            await update.message.reply_text("❌ Error al cambiar de diapositiva")

    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /status - Muestra el estado actual de la clase seleccionada."""
        chat_id = update.effective_chat.id
        class_id = self.active_classes.get(chat_id)
        
        if not class_id:
            await update.message.reply_text("⚠️ Primero selecciona una clase con /select <ID>")
            return

        class_data = self.store.get_class(class_id)
        if not class_data:
            await update.message.reply_text("❌ Clase no encontrada.")
            return

        status_emoji = {
            "ready": "⚪",
            "live": "🟢",
            "ended": "🔴",
        }.get(class_data.get("status"), "⚪")

        response = (
            f"{status_emoji} *Estado de la Clase*\n\n"
            f"*Título:* {class_data['title']}\n"
            f"*Estado:* {class_data.get('status', 'ready')}\n"
            f"*Diapositiva:* {class_data.get('current_slide', 0)}/{class_data.get('total_slides', 0)}\n"
            f"*ID:* `{class_id}`"
        )
        
        await update.message.reply_text(response, parse_mode="Markdown")

    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Maneja los botones inline."""
        query = update.callback_query
        await query.answer()

        data = query.data
        action, class_id = data.split("_", 1)

        if action == "next":
            updated = self.control_action(class_id, "next")
            if updated:
                await query.edit_message_text(
                    f"➡️ Siguiente diapositiva\n"
                    f"Actual: {updated.get('current_slide', 0)}/{updated.get('total_slides', 0)}"
                )
            else:
                await query.edit_message_text("❌ Error al avanzar")

        elif action == "prev":
            updated = self.control_action(class_id, "prev")
            if updated:
                await query.edit_message_text(
                    f"⬅️ Diapositiva anterior\n"
                    f"Actual: {updated.get('current_slide', 0)}/{updated.get('total_slides', 0)}"
                )
            else:
                await query.edit_message_text("❌ Error al retroceder")

        elif action == "status":
            class_data = self.store.get_class(class_id)
            if class_data:
                await query.edit_message_text(
                    f"ℹ️ Diapositiva: {class_data.get('current_slide', 0)}/{class_data.get('total_slides', 0)}"
                )

    def setup_handlers(self):
        """Configura todos los handlers del bot."""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("list", self.list_command))
        self.application.add_handler(CommandHandler("select", self.select_command))
        self.application.add_handler(CommandHandler("next", self.next_command))
        self.application.add_handler(CommandHandler("prev", self.prev_command))
        self.application.add_handler(CommandHandler("goto", self.goto_command))
        self.application.add_handler(CommandHandler("status", self.status_command))
        self.application.add_handler(CallbackQueryHandler(self.button_callback))

    async def start_bot(self):
        """Inicia el bot de Telegram."""
        self.application = Application.builder().token(self.token).build()
        self.setup_handlers()
        await self.application.initialize()
        await self.application.start()
        await self.application.updater.start_polling()
        logger.info("Telegram bot started successfully")

    async def stop_bot(self):
        """Detiene el bot de Telegram."""
        if self.application:
            await self.application.updater.stop()
            await self.application.stop()
            await self.application.shutdown()
            logger.info("Telegram bot stopped")
