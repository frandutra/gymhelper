CREATE TYPE "public"."body_part" AS ENUM('back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('es', 'en');--> statement-breakpoint
CREATE TYPE "public"."unit_preference" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" text NOT NULL,
	"name" text NOT NULL,
	"body_part" "body_part" NOT NULL,
	"target" text NOT NULL,
	"muscle_group" text NOT NULL,
	"secondary_muscles" text[] DEFAULT '{}' NOT NULL,
	"equipment" text NOT NULL,
	"instructions" jsonb NOT NULL,
	"instruction_steps" jsonb NOT NULL,
	"image_path" text NOT NULL,
	"gif_path" text NOT NULL,
	"attribution" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_dataset_id_unique" UNIQUE("dataset_id")
);
--> statement-breakpoint
ALTER TABLE "exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routine_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"name" text NOT NULL,
	"weekday" integer,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"target_sets" integer NOT NULL,
	"target_reps" text NOT NULL,
	"rest_seconds" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric NOT NULL,
	"reps" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "set_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"locale" "locale" DEFAULT 'es' NOT NULL,
	"unit_preference" "unit_preference" DEFAULT 'kg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_day_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routine_days" ADD CONSTRAINT "routine_days_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_day_id_routine_days_id_fk" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_day_id_routine_days_id_fk" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE set null ON UPDATE no action;