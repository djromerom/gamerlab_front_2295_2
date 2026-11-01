# ARK-101 - Check-in de jurados por QR

## Cambios incluidos

- Añade el rol frontend `Staff`.
- Añade rutas protegidas para check-in y creación de cuentas Staff.
- Añade escaneo QR con cámara en navegadores compatibles.
- Añade búsqueda y registro manual de jurados.
- Añade creación de cuentas Staff desde el panel de administración.
- Añade categoría y tipo operativo al formulario de creación de jurados.

## Requisitos de infraestructura

- El frontend debe servirse por HTTPS en entornos distintos de `localhost`.
- El navegador necesita permiso de cámara para la página de check-in.
- El backend debe tener disponible la migración y permisos ARK-100.
- El backend debe aplicar los permisos:
  - `JUROR_CHECK_IN` para `Staff` y `Administrador`.
  - `MANAGE_STAFF_ACCOUNTS` para `Administrador`.
- La variable `VITE_ENDPOINT_BACKEND` debe apuntar al backend correcto.

## Dependencias

El frontend añade el paquete:

```text
html5-qrcode
```

La instalación y el build se realizan con:

```bash
npm ci
npm run build
```

## Endpoints utilizados

```text
POST /juror-checkin/scan
GET  /juror-checkin/search?q=<texto>
POST /juror-checkin/manual
POST /staff
```

Todas las solicitudes usan cookies de sesión y `credentials: include`.

## Despliegue en Arkad-test

1. Desplegar el backend ARK-100 con su migración aplicada.
2. Desplegar el frontend con `VITE_ENDPOINT_BACKEND` configurado hacia Arkad-test.
3. Verificar que el sitio completo se sirva por HTTPS.
4. Confirmar que `/check-in-jurados` carga sin errores.
5. Crear una cuenta Staff mediante `POST /staff` o desde `/cuentas-staff`.

## Prueba de humo

1. Iniciar sesión como Administrador.
2. Crear un jurado desde `/jurados` indicando categoría y tipo.
3. Generar escarapelas para el jurado desde `/escarapelas`.
4. Iniciar sesión como Staff.
5. Abrir `/check-in-jurados`.
6. Autorizar la cámara y escanear el QR.
7. Confirmar nombre, categoría y grupos.
8. Escanear el mismo QR otra vez y verificar el aviso de `Ya registrado`.
9. Probar un QR inválido.
10. Usar la búsqueda manual y registrar un jurado sin escarapela.
11. Verificar que otro rol no pueda abrir `/check-in-jurados`.
