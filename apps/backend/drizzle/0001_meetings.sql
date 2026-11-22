CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_type_id" varchar(9) NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"guest_name" varchar(100) NOT NULL,
	"guest_email" varchar(254) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "meetings_meeting_type_id_meeting_types_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_types"("id"),
	CONSTRAINT "meetings_no_overlap" EXCLUDE USING gist (tstzrange("start_at", "end_at", '[)') WITH &&)
);
