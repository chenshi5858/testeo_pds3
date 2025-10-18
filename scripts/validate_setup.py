#!/usr/bin/env python3
"""
Script de validación de configuración del sistema.
Verifica que todas las dependencias y variables de entorno estén correctamente configuradas.

Uso:
    python scripts/validate_setup.py
"""

import os
import sys
import json
from pathlib import Path

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    """Print a section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(60)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text):
    """Print success message"""
    print(f"{Colors.GREEN}✓{Colors.RESET} {text}")

def print_error(text):
    """Print error message"""
    print(f"{Colors.RED}✗{Colors.RESET} {text}")

def print_warning(text):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {text}")

def print_info(text):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ{Colors.RESET} {text}")

def check_environment_variables():
    """Check if environment variables are configured"""
    print_header("VARIABLES DE ENTORNO")
    
    # Load .env file if it exists
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if env_file.exists():
        print_success(f"Archivo .env encontrado: {env_file.absolute()}")
        with open(env_file, 'r') as f:
            env_content = f.read()
    elif env_example.exists():
        print_warning("Archivo .env no encontrado, usando .env.example")
        with open(env_example, 'r') as f:
            env_content = f.read()
    else:
        print_error("No se encontró ni .env ni .env.example")
        return False
    
    # Check specific variables
    variables = {
        'TELEGRAM_BOT_TOKEN': {'required': False, 'description': 'Token del bot de Telegram'},
        'OPENAI_API_KEY': {'required': False, 'description': 'API key de OpenAI'},
        'FLASK_ENV': {'required': True, 'description': 'Entorno de Flask'},
        'VITE_API_BASE_URL': {'required': True, 'description': 'URL del backend'},
        'VITE_SOCKET_URL': {'required': True, 'description': 'URL de WebSocket'},
    }
    
    all_good = True
    for var_name, var_info in variables.items():
        var_value = os.getenv(var_name)
        
        if var_value and var_value.strip() and not var_value.startswith('obtener_de'):
            print_success(f"{var_name}: Configurado")
        elif var_info['required']:
            print_error(f"{var_name}: NO CONFIGURADO (requerido) - {var_info['description']}")
            all_good = False
        else:
            print_warning(f"{var_name}: No configurado (opcional) - {var_info['description']}")
    
    return all_good

def check_directories():
    """Check if required directories exist"""
    print_header("ESTRUCTURA DE DIRECTORIOS")
    
    directories = [
        ('backend/storage', True),
        ('backend/storage/uploads', True),
        ('backend/storage/conversions', True),
        ('backend/storage/data', True),
        ('frontend/src', True),
        ('docs', False),
    ]
    
    all_good = True
    for dir_path, required in directories:
        path = Path(dir_path)
        if path.exists():
            print_success(f"{dir_path}: Existe")
        elif required:
            print_error(f"{dir_path}: NO EXISTE (creando...)")
            path.mkdir(parents=True, exist_ok=True)
            print_success(f"{dir_path}: Creado")
        else:
            print_warning(f"{dir_path}: No existe (opcional)")
    
    return all_good

def check_files():
    """Check if required files exist"""
    print_header("ARCHIVOS CLAVE")
    
    files = {
        'backend/app.py': True,
        'backend/telegram_bot.py': True,
        'backend/requirements.txt': True,
        'frontend/package.json': True,
        'docker-compose.yml': True,
        'backend/storage/data/classes.json': False,
        'docs/ARCHITECTURE.md': False,
        'docs/ENVIRONMENT_VARIABLES.md': False,
    }
    
    all_good = True
    for file_path, required in files.items():
        path = Path(file_path)
        if path.exists():
            size = path.stat().st_size
            print_success(f"{file_path}: Existe ({size} bytes)")
        elif required:
            print_error(f"{file_path}: NO EXISTE (requerido)")
            all_good = False
        else:
            print_warning(f"{file_path}: No existe (opcional)")
    
    # Initialize classes.json if it doesn't exist
    classes_json = Path('backend/storage/data/classes.json')
    if not classes_json.exists():
        print_info("Inicializando classes.json...")
        classes_json.parent.mkdir(parents=True, exist_ok=True)
        with open(classes_json, 'w') as f:
            json.dump([], f)
        print_success("classes.json creado")
    
    return all_good

def check_docker():
    """Check if Docker is available"""
    print_header("DOCKER")
    
    try:
        import subprocess
        result = subprocess.run(['docker', '--version'], 
                              capture_output=True, 
                              text=True, 
                              check=True)
        print_success(f"Docker instalado: {result.stdout.strip()}")
        
        result = subprocess.run(['docker', 'compose', 'version'], 
                              capture_output=True, 
                              text=True, 
                              check=True)
        print_success(f"Docker Compose instalado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("Docker no está instalado o no está en PATH")
        print_info("Descarga Docker desde: https://www.docker.com/products/docker-desktop")
        return False

def check_python_dependencies():
    """Check if Python dependencies are installed (local dev only)"""
    print_header("DEPENDENCIAS PYTHON (desarrollo local)")
    
    requirements_file = Path('backend/requirements.txt')
    if not requirements_file.exists():
        print_error("requirements.txt no encontrado")
        return False
    
    with open(requirements_file, 'r') as f:
        requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    print_info(f"Encontrados {len(requirements)} paquetes en requirements.txt")
    
    try:
        import pkg_resources
        installed = {pkg.key for pkg in pkg_resources.working_set}
        
        missing = []
        for req in requirements:
            pkg_name = req.split('==')[0].split('>=')[0].split('<=')[0].lower()
            if pkg_name not in installed:
                missing.append(pkg_name)
        
        if missing:
            print_warning(f"Paquetes no instalados: {', '.join(missing)}")
            print_info("Ejecuta: cd backend && pip install -r requirements.txt")
        else:
            print_success("Todas las dependencias están instaladas")
        
        return len(missing) == 0
    except ImportError:
        print_warning("pkg_resources no disponible, omitiendo verificación")
        return True

def check_nodejs():
    """Check if Node.js is available"""
    print_header("NODE.JS (desarrollo local)")
    
    try:
        import subprocess
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, 
                              text=True, 
                              check=True)
        print_success(f"Node.js instalado: {result.stdout.strip()}")
        
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, 
                              text=True, 
                              check=True)
        print_success(f"npm instalado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_warning("Node.js no está instalado (no requerido si usas Docker)")
        print_info("Para desarrollo local: https://nodejs.org/")
        return False

def print_summary(results):
    """Print summary of validation"""
    print_header("RESUMEN")
    
    all_passed = all(results.values())
    
    if all_passed:
        print_success("✓ Todas las validaciones pasaron correctamente")
        print_info("\nPróximos pasos:")
        print("  1. Ejecuta: docker compose up --build")
        print("  2. Abre: http://localhost:5173")
        print("  3. Configura tu bot de Telegram (ver README.md)")
    else:
        print_error("✗ Algunas validaciones fallaron")
        print_info("\nRevisión requerida:")
        for check, passed in results.items():
            if not passed:
                print(f"  - {check}")
        print_info("\nConsulta la documentación:")
        print("  - README.md")
        print("  - docs/ENVIRONMENT_VARIABLES.md")
        print("  - docs/ARCHITECTURE.md")
    
    return all_passed

def main():
    """Main validation function"""
    print(f"{Colors.BOLD}Sistema de Validación de Configuración{Colors.RESET}")
    print(f"Verificando configuración del proyecto...\n")
    
    results = {
        'Variables de entorno': check_environment_variables(),
        'Directorios': check_directories(),
        'Archivos': check_files(),
        'Docker': check_docker(),
        'Python (local)': check_python_dependencies(),
        'Node.js (local)': check_nodejs(),
    }
    
    success = print_summary(results)
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
