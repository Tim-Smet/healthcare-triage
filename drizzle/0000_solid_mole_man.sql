CREATE TABLE "triage_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"urgency" text NOT NULL,
	"pathway" text NOT NULL,
	"next" text NOT NULL,
	"consultation_type" text NOT NULL,
	"source" text NOT NULL,
	"reason" text,
	"ranked_pathways" jsonb NOT NULL,
	"next_steps" jsonb NOT NULL,
	"input" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
