jest.mock('../../src/database/db', () => ({
    get: jest.fn(),
    run: jest.fn(),
    serialize: jest.fn(cb => cb())
}));

const AutenticacionService = require('../../src/services/autenticacionService');
const UsuarioModel = require('../../src/models/usuarioModel');
const bcrypt = require('bcryptjs');

describe('AutenticacionService & UsuarioModel - Registro', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mockear las consultas de base de datos directas
        UsuarioModel.buscarPorEmail = jest.fn();
        UsuarioModel.crear = jest.fn();
    });

    describe('verificarUsuario (Validaciones)', () => {
        const datosValidos = {
            nombre: 'Juan',
            apellido: 'Perez',
            email: 'juan@test.com',
            contrasena: '123456',
            confirmarContrasena: '123456',
            id_provincia: 1,
            id_localidad: 10
        };

        test('Debe lanzar error si algún campo obligatorio falta', async () => {
            const campos = ['nombre', 'apellido', 'email', 'contrasena', 'confirmarContrasena', 'id_provincia', 'id_localidad'];
            
            for (const campo of campos) {
                const datosIncompletos = { ...datosValidos };
                delete datosIncompletos[campo];
                
                await expect(UsuarioModel.verificarUsuario(datosIncompletos))
                    .rejects
                    .toThrow('Campo obligatorio incompleto. Por favor completa todos los datos obligatorios.');
            }
        });

        test('Debe lanzar error si la contraseña tiene menos de 6 caracteres', async () => {
            const datosContrasenaCorta = {
                ...datosValidos,
                contrasena: '12345',
                confirmarContrasena: '12345'
            };

            await expect(UsuarioModel.verificarUsuario(datosContrasenaCorta))
                .rejects
                .toThrow('La contraseña debe tener al menos 6 caracteres.');
        });

        test('Debe lanzar error si las contraseñas no coinciden', async () => {
            const datosContrasenaDiferente = {
                ...datosValidos,
                contrasena: '123456',
                confirmarContrasena: '1234567'
            };

            await expect(UsuarioModel.verificarUsuario(datosContrasenaDiferente))
                .rejects
                .toThrow('Las contraseñas no coinciden. Por favor verifícalas.');
        });

        test('Debe lanzar error si el correo ya está registrado', async () => {
            // Simular que el usuario ya existe en base de datos
            UsuarioModel.buscarPorEmail.mockResolvedValue(new UsuarioModel({ id_usuario: 5, email: 'juan@test.com' }));

            await expect(UsuarioModel.verificarUsuario(datosValidos))
                .rejects
                .toThrow('Los datos son incorrectos: El correo electrónico ya está registrado.');
            
            expect(UsuarioModel.buscarPorEmail).toHaveBeenCalledWith('juan@test.com');
        });

        test('Debe retornar true si todos los datos son válidos y el email no existe', async () => {
            UsuarioModel.buscarPorEmail.mockResolvedValue(null);

            const resultado = await UsuarioModel.verificarUsuario(datosValidos);
            expect(resultado).toBe(true);
        });
    });

    describe('registrarUsuario', () => {
        const datosRegistro = {
            nombre: 'Carlos',
            apellido: 'Gomez',
            email: 'carlos@test.com',
            contrasena: 'securepassword',
            id_rol: 2,
            calle: 'Av. Corrientes',
            numero_calle: '1234',
            nro_piso: '5',
            nro_departamento: 'B',
            codigo_postal: '1000',
            id_localidad: '15'
        };

        test('Debe encriptar la contraseña y guardar el usuario con su dirección', async () => {
            const mockIdNuevo = 42;
            UsuarioModel.crear.mockResolvedValue(mockIdNuevo);

            const idGenerado = await AutenticacionService.registrarUsuario(datosRegistro);

            expect(idGenerado).toBe(mockIdNuevo);
            
            // Verificar encriptación
            const hashLlamado = UsuarioModel.crear.mock.calls[0][0].contrasena;
            expect(hashLlamado).not.toBe('securepassword');
            expect(await bcrypt.compare('securepassword', hashLlamado)).toBe(true);

            // Verificar mapeo correcto de datos al modelo
            expect(UsuarioModel.crear).toHaveBeenCalledWith({
                nombre: 'Carlos',
                apellido: 'Gomez',
                email: 'carlos@test.com',
                contrasena: expect.any(String),
                id_rol: 2,
                address: {
                    calle: 'Av. Corrientes',
                    numero_calle: '1234',
                    nro_piso: '5',
                    nro_departamento: 'B',
                    codigo_postal: '1000',
                    id_localidad: 15
                }
            });
        });
    });
});
