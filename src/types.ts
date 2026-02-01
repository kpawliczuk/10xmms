import type { Enums, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

/**
 * Represents the public profile data of a user.
 * This type directly maps to the `profiles` table row in the database.
 */
export type ProfileDto = Tables<"profiles">;

/**
 * Represents the command for updating a user's profile information.
 * This type is a subset of the `profiles` update model, containing only the fields
 * that can be modified through the API.
 */
export type UpdateProfileCommand = Pick<TablesUpdate<"profiles">, "username">;

/**
 * Represents the command for initiating the MMS generation process.
 * It contains the text prompt provided by the user.
 * This type is derived from the `mms_history` insert model to ensure consistency.
 */
export type GenerateMmsCommand = Pick<TablesInsert<"mms_history">, "prompt">;

/**
 * Represents the response DTO after successfully initiating an MMS generation request.
 * It provides a confirmation message and the unique ID of the newly created history record.
 */
export type GenerateMmsResponseDto = {
  message: string;
  history_id: Tables<"mms_history">["id"];
};

/**
 * Represents a single item in the user's MMS history list.
 * This DTO is a subset of the `mms_history` table row, intentionally omitting
 * the large `image_data` field for performance reasons in list views.
 */
export type MmsHistoryDto = Omit<Tables<"mms_history">, "image_data" | "user_id">;

/**
 * Re-exports the `mms_status` enum type from the database definitions for use in the application.
 */
export type MmsStatus = Enums<"mms_status">;