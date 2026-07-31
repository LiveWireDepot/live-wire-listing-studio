import {integer,sqliteTable,text} from "drizzle-orm/sqlite-core";

export const ebayConnections=sqliteTable("ebay_connections",{
  userEmail:text("user_email").primaryKey(),
  environment:text("environment").notNull(),
  accessToken:text("access_token").notNull(),
  accessTokenExpiresAt:integer("access_token_expires_at").notNull(),
  refreshToken:text("refresh_token").notNull(),
  refreshTokenExpiresAt:integer("refresh_token_expires_at").notNull(),
  updatedAt:integer("updated_at").notNull(),
});
