const UserService = require('../users/user.service');

// Auth service uses UserService for login
// Can be extended with additional auth features later
class AuthService {
  static async login(email, password) {
    return UserService.login(email, password);
  }
}

module.exports = AuthService;

