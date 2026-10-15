import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Response } from "express";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    await this.issueAuthCookies(user.id, user.email, res);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.issueAuthCookies(user.id, user.email, res);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async issueAuthCookies(
    userId: string,
    email: string,
    res: Response,
  ) {
    const accessToken = await this.jwt.signAsync({
      sub: userId,
      email,
    });

    const refreshToken = randomBytes(48).toString("hex");
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const days = Number(this.config.get("REFRESH_TOKEN_EXPIRES_DAYS", 7));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId,
      },
    });

    const isProd = this.config.get("NODE_ENV") === "production";
    const cookieDomain = this.config.get<string>("COOKIE_DOMAIN");

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      domain: cookieDomain,
      path: "/",
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      domain: cookieDomain,
      path: "/",
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }
}
