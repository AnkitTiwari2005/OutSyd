CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "building_inputs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"length_ft" double precision NOT NULL,
	"breadth_ft" double precision NOT NULL,
	"height_ft" double precision NOT NULL,
	"plot_area_sqft" double precision NOT NULL,
	"num_floors" integer NOT NULL,
	"typology" text NOT NULL,
	"building_use" text NOT NULL,
	"soil_type" text NOT NULL,
	"location_region" text NOT NULL,
	"quality_tier" text NOT NULL,
	"structural_system" text DEFAULT 'Not_sure',
	"foundation_type" text DEFAULT 'Not_sure',
	"num_lifts" integer DEFAULT 0,
	"num_staircases" integer DEFAULT 1,
	"parking_levels" integer DEFAULT 0,
	"units_per_floor" integer,
	"seismic_zone" text DEFAULT 'Not_sure',
	"soil_bearing_capacity" double precision,
	"wind_zone" text DEFAULT 'Not_sure',
	"service_floors" integer DEFAULT 0,
	"podium_levels" integer DEFAULT 0,
	"facade_type" text DEFAULT 'Not_sure',
	"hvac_scope" text DEFAULT 'Not_sure',
	"structural_drawing_url" text,
	"target_timeline_months" integer,
	"green_cert_target" text,
	"local_rate_overrides" text,
	"classification_tier" text,
	"building_category" text,
	"computed_bua_sqft" double precision,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coefficient_datasets" (
	"version" text PRIMARY KEY NOT NULL,
	"description" text,
	"published_by" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rates_json" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"building_input_id" text NOT NULL,
	"coefficient_dataset_version" text NOT NULL,
	"accuracy_band" text NOT NULL,
	"classification_tier" text NOT NULL,
	"building_category" text NOT NULL,
	"classification_reasons" text,
	"plinth_area_estimate" double precision,
	"cubic_content_estimate" double precision,
	"grand_total_material_cost" double precision NOT NULL,
	"grand_total_with_labor" double precision,
	"regional_index_applied" double precision DEFAULT 1,
	"result_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"guest_token" text,
	"name" text DEFAULT 'Untitled Project' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_rate_index" (
	"id" text PRIMARY KEY NOT NULL,
	"region_name" text NOT NULL,
	"region_code" text,
	"index_value" double precision DEFAULT 1 NOT NULL,
	"effective_date" text NOT NULL,
	"updated_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"estimate_id" text NOT NULL,
	"file_url" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"name" text,
	"image" text,
	"password_hash" text,
	"role" text DEFAULT 'registered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_inputs" ADD CONSTRAINT "building_inputs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_building_input_id_building_inputs_id_fk" FOREIGN KEY ("building_input_id") REFERENCES "public"."building_inputs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_coefficient_dataset_version_coefficient_datasets_version_fk" FOREIGN KEY ("coefficient_dataset_version") REFERENCES "public"."coefficient_datasets"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "building_inputs_project_id_idx" ON "building_inputs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "estimates_project_id_idx" ON "estimates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "estimates_building_input_id_idx" ON "estimates" USING btree ("building_input_id");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_guest_token_idx" ON "projects" USING btree ("guest_token");--> statement-breakpoint
CREATE INDEX "reports_estimate_id_idx" ON "reports" USING btree ("estimate_id");