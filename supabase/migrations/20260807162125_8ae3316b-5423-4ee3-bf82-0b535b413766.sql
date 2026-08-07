-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  class_level text,
  course text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- STUDY MATERIALS
CREATE TABLE public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  class_level text,
  subject text,
  file_path text,
  external_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_public_read" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "materials_admin_write" ON public.study_materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STUDY TRACKER
CREATE TABLE public.study_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  due_date date,
  duration_min integer NOT NULL DEFAULT 30,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks TO authenticated;
GRANT ALL ON public.study_tasks TO service_role;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_own" ON public.study_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  minutes integer NOT NULL,
  studied_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON public.study_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  class_level text,
  score integer NOT NULL,
  total integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_own" ON public.quiz_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COLLEGES
CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  college_type text,
  nirf_rank integer,
  website text,
  branches jsonb NOT NULL DEFAULT '[]'::jsonb,
  avg_package numeric,
  highest_package numeric,
  placement_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.colleges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colleges TO authenticated;
GRANT ALL ON public.colleges TO service_role;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colleges_public_read" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "colleges_admin_write" ON public.colleges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.college_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.college_feedback TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_feedback TO authenticated;
GRANT ALL ON public.college_feedback TO service_role;
ALTER TABLE public.college_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_public_read" ON public.college_feedback FOR SELECT USING (true);
CREATE POLICY "feedback_insert_own" ON public.college_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_update_own" ON public.college_feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_delete_own" ON public.college_feedback FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text NOT NULL,
  organizer text,
  starts_at timestamptz NOT NULL,
  mode text,
  location text,
  url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_admin_write" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RESOURCES
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  url text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_public_read" ON public.resources FOR SELECT USING (true);
CREATE POLICY "resources_admin_write" ON public.resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SEED COLLEGES
INSERT INTO public.colleges (name, state, district, college_type, nirf_rank, website, branches, avg_package, highest_package, placement_pct) VALUES
('IIT Bombay','Maharashtra','Mumbai','IIT',3,'https://www.iitb.ac.in','[{"branch":"Computer Science","avg":32.5,"highest":210},{"branch":"Electrical","avg":24.1,"highest":98},{"branch":"Mechanical","avg":18.4,"highest":64},{"branch":"Civil","avg":14.2,"highest":42}]',23.5,210,92.5),
('IIT Delhi','Delhi','New Delhi','IIT',2,'https://home.iitd.ac.in','[{"branch":"Computer Science","avg":33.1,"highest":200},{"branch":"Electrical","avg":25.3,"highest":95},{"branch":"Mechanical","avg":17.9,"highest":60},{"branch":"Chemical","avg":15.6,"highest":48}]',24.2,200,91.0),
('IIT Madras','Tamil Nadu','Chennai','IIT',1,'https://www.iitm.ac.in','[{"branch":"Computer Science","avg":31.8,"highest":190},{"branch":"Electrical","avg":23.4,"highest":88},{"branch":"Mechanical","avg":16.8,"highest":55},{"branch":"Aerospace","avg":15.1,"highest":44}]',22.9,190,93.2),
('IIT Kanpur','Uttar Pradesh','Kanpur','IIT',5,'https://www.iitk.ac.in','[{"branch":"Computer Science","avg":30.4,"highest":180},{"branch":"Electrical","avg":22.7,"highest":80},{"branch":"Mechanical","avg":16.2,"highest":52}]',21.6,180,90.4),
('IIT Kharagpur','West Bengal','Kharagpur','IIT',6,'https://www.iitkgp.ac.in','[{"branch":"Computer Science","avg":29.6,"highest":175},{"branch":"Electronics","avg":21.9,"highest":78},{"branch":"Mining","avg":14.8,"highest":40}]',20.8,175,89.1),
('NIT Trichy','Tamil Nadu','Tiruchirappalli','NIT',9,'https://www.nitt.edu','[{"branch":"Computer Science","avg":22.4,"highest":88},{"branch":"Electronics","avg":16.7,"highest":54},{"branch":"Mechanical","avg":12.9,"highest":36}]',16.2,88,88.0),
('NIT Surathkal','Karnataka','Dakshina Kannada','NIT',12,'https://www.nitk.ac.in','[{"branch":"Computer Science","avg":21.8,"highest":85},{"branch":"Information Technology","avg":19.4,"highest":70},{"branch":"Civil","avg":10.2,"highest":28}]',15.4,85,86.5),
('NIT Warangal','Telangana','Warangal','NIT',21,'https://www.nitw.ac.in','[{"branch":"Computer Science","avg":20.9,"highest":80},{"branch":"Electrical","avg":14.6,"highest":45},{"branch":"Mechanical","avg":11.8,"highest":33}]',14.9,80,85.2),
('BITS Pilani','Rajasthan','Jhunjhunu','Private',20,'https://www.bits-pilani.ac.in','[{"branch":"Computer Science","avg":24.6,"highest":120},{"branch":"Electronics","avg":17.2,"highest":62},{"branch":"Chemical","avg":11.4,"highest":34}]',17.8,120,90.0),
('VIT Vellore','Tamil Nadu','Vellore','Private',11,'https://vit.ac.in','[{"branch":"Computer Science","avg":11.4,"highest":88},{"branch":"Electronics","avg":8.2,"highest":42},{"branch":"Mechanical","avg":6.4,"highest":24}]',9.2,88,84.0),
('Delhi Technological University','Delhi','New Delhi','State',29,'http://dtu.ac.in','[{"branch":"Computer Science","avg":19.6,"highest":85},{"branch":"Information Technology","avg":18.1,"highest":72},{"branch":"Mechanical","avg":10.4,"highest":30}]',14.1,85,83.5),
('Netaji Subhas University of Technology','Delhi','New Delhi','State',52,'https://nsut.ac.in','[{"branch":"Computer Science","avg":18.2,"highest":78},{"branch":"Electronics","avg":12.6,"highest":45}]',13.2,78,82.0),
('Jadavpur University','West Bengal','Kolkata','State',13,'https://jadavpuruniversity.in','[{"branch":"Computer Science","avg":16.8,"highest":65},{"branch":"Electrical","avg":11.2,"highest":38},{"branch":"Civil","avg":8.4,"highest":22}]',12.1,65,80.5),
('COEP Technological University','Maharashtra','Pune','State',63,'https://www.coep.org.in','[{"branch":"Computer Science","avg":14.2,"highest":58},{"branch":"Mechanical","avg":8.6,"highest":26}]',10.4,58,79.0),
('IIIT Hyderabad','Telangana','Hyderabad','IIIT',47,'https://www.iiit.ac.in','[{"branch":"Computer Science","avg":32.4,"highest":135},{"branch":"Electronics & Communication","avg":22.1,"highest":68}]',28.6,135,94.0),
('Anna University CEG','Tamil Nadu','Chennai','State',14,'https://www.annauniv.edu','[{"branch":"Computer Science","avg":9.8,"highest":52},{"branch":"Civil","avg":5.6,"highest":18}]',7.6,52,76.0),
('MNNIT Allahabad','Uttar Pradesh','Prayagraj','NIT',49,'http://www.mnnit.ac.in','[{"branch":"Computer Science","avg":19.4,"highest":72},{"branch":"Mechanical","avg":10.1,"highest":30}]',13.4,72,84.0),
('IIT Roorkee','Uttarakhand','Haridwar','IIT',4,'https://www.iitr.ac.in','[{"branch":"Computer Science","avg":29.1,"highest":170},{"branch":"Electrical","avg":21.4,"highest":76},{"branch":"Civil","avg":13.6,"highest":38}]',20.4,170,88.7),
('IIT Guwahati','Assam','Kamrup','IIT',7,'https://www.iitg.ac.in','[{"branch":"Computer Science","avg":28.4,"highest":165},{"branch":"Electronics","avg":20.6,"highest":72}]',19.8,165,87.4),
('RV College of Engineering','Karnataka','Bengaluru Urban','Private',99,'https://www.rvce.edu.in','[{"branch":"Computer Science","avg":13.6,"highest":60},{"branch":"Information Science","avg":12.2,"highest":48},{"branch":"Mechanical","avg":6.8,"highest":20}]',10.2,60,81.0);

-- SEED EVENTS
INSERT INTO public.events (title, event_type, organizer, starts_at, mode, location, url, description) VALUES
('Smart India Hackathon 2026','hackathon','Ministry of Education, Govt. of India', now() + interval '38 days','Offline','Multiple nodal centres','https://sih.gov.in','India''s biggest nationwide hackathon for students across engineering and school innovation tracks.'),
('Google Hash Code Practice Round','hackathon','Google', now() + interval '19 days','Online','Worldwide','https://codingcompetitions.withgoogle.com','Team-based optimisation programming challenge, great practice for competitive coding.'),
('Shashank Computics Monthly Coding Quiz','quiz','Shashank Computics', now() + interval '7 days','Online','shashankcomputics.in','','Timed 30-question quiz across C, Python, DSA and web fundamentals with a class-wise leaderboard.'),
('NSEJS / NSEP Olympiad Screening','quiz','Indian Association of Physics Teachers', now() + interval '54 days','Offline','Registered schools','https://iapt.org.in','National olympiad screening test for Class 9-12 science students.'),
('HackWithInfy','hackathon','Infosys', now() + interval '72 days','Online','India','https://www.infosys.com/careers/hackwithinfy.html','Coding contest for pre-final year engineering students with internship and PPO opportunities.'),
('CBSE Class 10 & 12 Mock Test Series','quiz','Shashank Computics', now() + interval '14 days','Online','shashankcomputics.in','','Full-syllabus mock tests with instant analytics and chapter-wise weakness reports.');

-- SEED RESOURCES
INSERT INTO public.resources (title, category, url, description) VALUES
('freeCodeCamp Full Curriculum','Coding','https://www.freecodecamp.org','Thousands of hours of free, project-based web development and Python certification content.'),
('The Odin Project','Coding','https://www.theodinproject.com','Full-stack JavaScript and Ruby curriculum built entirely from free open resources.'),
('CS50x by Harvard','Coding','https://cs50.harvard.edu/x/','The legendary introduction to computer science, from C to Python to SQL.'),
('LeetCode','Coding','https://leetcode.com','Practice DSA problems used in real placement and internship interviews.'),
('GeeksforGeeks DSA Sheet','Coding','https://www.geeksforgeeks.org/dsa-sheet-by-love-babbar/','A curated 450-question sheet covering every data structure and algorithm topic.'),
('NCERT Official Textbooks','School','https://ncert.nic.in/textbook.php','Every NCERT textbook for Class 1 to 12, free to download as PDF.'),
('Khan Academy','School','https://www.khanacademy.org','Free lessons and practice in maths, science and computing for all school classes.'),
('NPTEL','Engineering','https://nptel.ac.in','IIT and IISc video lecture courses across every engineering branch.'),
('MIT OpenCourseWare','Engineering','https://ocw.mit.edu','Full MIT course materials, assignments and exams released free.'),
('GATE Overflow','Engineering','https://gateoverflow.in','Previous year GATE questions with detailed community solutions.'),
('Roadmap.sh','Coding','https://roadmap.sh','Visual step-by-step roadmaps for frontend, backend, DevOps, AI and more.'),
('Excalidraw','Other','https://excalidraw.com','Free whiteboard for sketching notes, flowcharts and system designs.');

-- SEED MATERIALS
INSERT INTO public.study_materials (title, description, category, class_level, subject, external_url) VALUES
('NCERT Mathematics — Class 10','Complete NCERT textbook with chapter-wise exercises.','school','10','Mathematics','https://ncert.nic.in/textbook.php'),
('NCERT Science — Class 9','Full NCERT science textbook covering physics, chemistry and biology.','school','9','Science','https://ncert.nic.in/textbook.php'),
('CBSE Class 12 Physics Notes','Condensed revision notes for the full Class 12 physics syllabus.','school','12','Physics','https://ncert.nic.in/textbook.php'),
('English Grammar Basics — Class 5','Simple grammar practice worksheets for primary students.','school','5','English','https://www.khanacademy.org'),
('Python for Absolute Beginners','Learn Python syntax, loops, functions and files from scratch.','coding','','Python','https://www.freecodecamp.org'),
('DSA in C++ — Complete Playlist','Arrays to graphs, with interview-focused problem sets.','coding','','DSA','https://www.geeksforgeeks.org'),
('Web Development Bootcamp Notes','HTML, CSS, JavaScript and React fundamentals in one place.','coding','','Web Development','https://www.theodinproject.com'),
('Engineering Mathematics — GATE','Linear algebra, calculus, probability and numerical methods.','engineering','','Mathematics','https://nptel.ac.in'),
('Digital Electronics Fundamentals','Logic gates, combinational and sequential circuit design.','engineering','','Electronics','https://nptel.ac.in'),
('Thermodynamics — Core Mechanical','Laws of thermodynamics with solved numericals.','engineering','','Mechanical','https://ocw.mit.edu');