DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'application_status'::regtype AND enumlabel = 'interviewed'
  ) THEN
    ALTER TYPE application_status ADD VALUE 'interviewed' AFTER 'interview';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'application_status'::regtype AND enumlabel = 'offered'
  ) THEN
    ALTER TYPE application_status ADD VALUE 'offered' AFTER 'interviewed';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'application_status'::regtype AND enumlabel = 'hired'
  ) THEN
    ALTER TYPE application_status ADD VALUE 'hired' AFTER 'offered';
  END IF;
END $$;
