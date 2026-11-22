CREATE TABLE "meeting_types" (
	"id" varchar(9) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"duration" integer NOT NULL,
	"position" serial NOT NULL,
	CONSTRAINT "meeting_types_position_unique" UNIQUE("position")
);
