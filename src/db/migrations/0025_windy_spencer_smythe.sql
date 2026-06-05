ALTER TABLE "folders" DROP CONSTRAINT "folders_user_id_name_unique";--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_parent_id_name_unique" UNIQUE("user_id","parent_id","name");