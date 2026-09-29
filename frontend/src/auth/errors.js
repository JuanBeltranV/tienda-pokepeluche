export function authErrorMessage(error) {
  switch (error?.name) {
    case 'AuthConfigurationError':
      return 'Falta configurar Cognito. Revisa las variables VITE_COGNITO_USER_POOL_ID y VITE_COGNITO_CLIENT_ID y reinicia Vite.'
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'Correo o contraseña incorrectos, o contraseña temporal vencida. Revisa tus datos o contacta al administrador.'
    case 'InvalidPasswordException':
    case 'PasswordHistoryPolicyViolationException':
      return 'La nueva contraseña no cumple la política de Cognito. Usa una contraseña diferente con la longitud y complejidad requeridas por el administrador.'
    case 'TooManyRequestsException':
    case 'LimitExceededException':
      return 'Hay demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
    case 'NetworkError':
      return 'No pudimos conectar con Cognito. Revisa tu conexión e inténtalo de nuevo.'
    case 'UserUnAuthenticatedException':
    case 'SessionUnavailableError':
      return 'Tu sesión no está disponible o ha vencido. Vuelve a iniciar sesión.'
    case 'SignInException':
      return 'El proceso de acceso venció. Vuelve a ingresar tu correo y contraseña temporal.'
    case 'UserAlreadyAuthenticatedException':
      return 'Ya existe una sesión. Recarga la página para comprobarla.'
    case 'UserNotConfirmedException':
      return 'La cuenta aún no está confirmada. Contacta al administrador.'
    default:
      return 'No se pudo completar la autenticación. Inténtalo otra vez; si continúa, consulta al administrador.'
  }
}

export function unsupportedStepMessage(step) {
  if (step === 'RESET_PASSWORD')
    return 'Esta cuenta requiere recuperar su contraseña. Contacta al administrador y vuelve a iniciar sesión.'
  if (step === 'CONFIRM_SIGN_UP')
    return 'La cuenta requiere confirmación. Contacta al administrador.'
  return 'Cognito solicita una verificación adicional que esta fase no admite. Contacta al administrador para revisar la configuración de la cuenta.'
}
