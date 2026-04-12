export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: number;
  duration: string;
  progress: number;
  category: string;
  status: 'not-started' | 'in-progress' | 'completed';
  students: number;
  instructor: string;
  lessons_list: Lesson[];
  highlights: string[];
}

export const courses: Course[] = [
  { 
    id: '1', 
    title: 'Multi Crew Cooperation (MCC)', 
    description: 'Master the principles of effective crew coordination in a commercial airline environment. The MCC module is designed for CPL holders transitioning to multi-crew jet operations, building the human factors skills that airlines test for in every interview.', 
    lessons: 12, 
    duration: '36 hrs', 
    progress: 65, 
    category: 'MCC', 
    status: 'in-progress', 
    students: 47, 
    instructor: 'Capt. Ali Hassan', 
    lessons_list: [
      { id: 'l1', title: 'Introduction to Multi-Crew Operations', duration: '45 min', completed: true, locked: false },
      { id: 'l2', title: 'Crew Resource Management Fundamentals', duration: '60 min', completed: true, locked: false },
      { id: 'l3', title: 'Standard Operating Procedures', duration: '50 min', completed: true, locked: false },
      { id: 'l4', title: 'Threat and Error Management', duration: '55 min', completed: true, locked: false },
      { id: 'l5', title: 'Communication & Briefing Techniques', duration: '40 min', completed: false, locked: false },
      { id: 'l6', title: 'Normal Procedures: Pre-flight', duration: '45 min', completed: false, locked: false },
      { id: 'l7', title: 'Normal Procedures: Takeoff & Climb', duration: '50 min', completed: false, locked: true },
      { id: 'l8', title: 'Normal Procedures: Cruise & Descent', duration: '45 min', completed: false, locked: true },
      { id: 'l9', title: 'Abnormal Procedures', duration: '60 min', completed: false, locked: true },
      { id: 'l10', title: 'Emergency Procedures', duration: '65 min', completed: false, locked: true },
      { id: 'l11', title: 'Line Oriented Flight Training (LOFT)', duration: '90 min', completed: false, locked: true },
      { id: 'l12', title: 'MCC Assessment & Debrief', duration: '60 min', completed: false, locked: true },
    ],
    highlights: [
      "Crew Resource Management (CRM) principles and application",
      "Threat and Error Management in line operations",
      "Standard Operating Procedures for normal and abnormal phases",
      "Communication techniques — callouts, briefings, and challenges",
      "Decision making under pressure and workload management",
      "Non-Technical Skills (NTS) assessment preparation"
    ]
  },
  { 
    id: '2', 
    title: 'Jet Orientation Course (JOC)', 
    description: 'Bridge the gap between piston and turboprop experience and high-performance jet operations. The JOC prepares you for the aerodynamic, systems, and performance differences you will encounter when transitioning to the Airbus A-320 family.', 
    lessons: 8, 
    duration: '24 hrs', 
    progress: 30, 
    category: 'JOC', 
    status: 'in-progress', 
    students: 39, 
    instructor: 'Capt. Usman Malik', 
    lessons_list: [
      { id: 'j1', title: 'Jet Aerodynamics & High-Speed Flight', duration: '60 min', completed: true, locked: false },
      { id: 'j2', title: 'High-Altitude Operations & Pressurization', duration: '55 min', completed: true, locked: false },
      { id: 'j3', title: 'Jet Performance & Weight & Balance', duration: '50 min', completed: false, locked: false },
      { id: 'j4', title: 'A-320 Family Overview & Systems', duration: '75 min', completed: false, locked: false },
      { id: 'j5', title: 'ECAM Systems & Warnings', duration: '60 min', completed: false, locked: true },
      { id: 'j6', title: 'Fuel Systems & Planning', duration: '45 min', completed: false, locked: true },
      { id: 'j7', title: 'FMS & Autopilot Operations', duration: '80 min', completed: false, locked: true },
      { id: 'j8', title: 'JOC Simulator Assessment', duration: '120 min', completed: false, locked: true },
    ],
    highlights: [
      "High-speed aerodynamics and compressibility effects",
      "High-altitude operations, pressurization and hypoxia awareness",
      "Jet performance — V speeds, flex thrust, and climb profiles",
      "Airbus A-320 family overview and philosophy",
      "ECAM system logic and caution/warning hierarchy",
      "FMS fundamentals and flight plan programming"
    ]
  },
  { 
    id: '3', 
    title: 'A-320 Procedures & Systems', 
    description: 'A comprehensive deep-dive into every Airbus A-320 aircraft system, limitation, and procedure. This module builds the technical knowledge base required to pass your type rating oral examination and operate confidently on line.', 
    lessons: 15, 
    duration: '45 hrs', 
    progress: 0, 
    category: 'Type', 
    status: 'not-started', 
    students: 28, 
    instructor: 'Capt. Zain Ahmed', 
    lessons_list: [
      { id: 'a1', title: 'A-320 Airframe & Powerplant', duration: '60 min', completed: false, locked: false },
      { id: 'a2', title: 'Flight Controls & EFCS', duration: '75 min', completed: false, locked: true },
      { id: 'a3', title: 'Hydraulic Systems', duration: '50 min', completed: false, locked: true },
      { id: 'a4', title: 'Electrical Systems', duration: '55 min', completed: false, locked: true },
      { id: 'a5', title: 'Pneumatic & Air Conditioning', duration: '45 min', completed: false, locked: true },
      { id: 'a6', title: 'Fuel System Operations', duration: '50 min', completed: false, locked: true },
      { id: 'a7', title: 'Navigation & Communication Systems', duration: '65 min', completed: false, locked: true },
      { id: 'a8', title: 'FMGC & Flight Planning', duration: '80 min', completed: false, locked: true },
      { id: 'a9', title: 'Normal Procedures Flows', duration: '90 min', completed: false, locked: true },
      { id: 'a10', title: 'Abnormal & Emergency Procedures', duration: '90 min', completed: false, locked: true },
      { id: 'a11', title: 'Aircraft Limitations', duration: '45 min', completed: false, locked: true },
      { id: 'a12', title: 'Weight & Performance', duration: '60 min', completed: false, locked: true },
      { id: 'a13', title: 'Meteorology for Jet Operations', duration: '55 min', completed: false, locked: true },
      { id: 'a14', title: 'RVSM & Special Operations', duration: '45 min', completed: false, locked: true },
      { id: 'a15', title: 'A-320 Written Examination', duration: '120 min', completed: false, locked: true },
    ],
    highlights: [
      "Flight controls and Electrical Flight Control System (EFCS)",
      "Hydraulic, electrical, and pneumatic systems in depth",
      "FMGC operation and managed vs selected flight modes",
      "All normal procedures — flows, checks, and callouts",
      "Abnormal and emergency procedures with ECAM actions",
      "Aircraft limitations, MEL categories, and airworthiness"
    ]
  },
  { 
    id: '4', 
    title: 'Simulator Briefings & Debriefs', 
    description: '50 hours of structured simulator sessions in a full-motion Airbus A-320 FFS. Each session is preceded by a detailed briefing and followed by a structured debrief. Designed to build confidence, consistency, and airline-standard performance before your type rating.', 
    lessons: 6, 
    duration: '12 hrs', 
    progress: 100, 
    category: 'SIM', 
    status: 'completed', 
    students: 52, 
    instructor: 'Capt. Ali Hassan', 
    lessons_list: [
      { id: 's1', title: 'Simulator Orientation & Controls', duration: '30 min', completed: true, locked: false },
      { id: 's2', title: 'Normal Procedures Simulator Briefing', duration: '45 min', completed: true, locked: false },
      { id: 's3', title: 'Abnormal Procedures Briefing', duration: '60 min', completed: true, locked: false },
      { id: 's4', title: 'Engine Failure Procedures', duration: '55 min', completed: true, locked: false },
      { id: 's5', title: 'Rejected Takeoff & Emergency Landing', duration: '60 min', completed: true, locked: false },
      { id: 's6', title: 'Final Debrief & Assessment Review', duration: '45 min', completed: true, locked: false },
    ],
    highlights: [
      "Pre-session briefings covering maneuvers and objectives",
      "Normal procedure flows — departure, cruise, approach, landing",
      "Instrument approaches — ILS, RNAV, and circling",
      "Engine failure and asymmetric handling at all flight phases",
      "Post-session debrief with performance review and areas of focus",
      "Full motion platform exposure — spatial awareness training"
    ]
  },
];

export const students = [
  { id: 's1', name: 'Ahmed Khan', email: 'student@zainco.pk', avatar: 'AK', course: 'MCC', progress: 65, lastActive: '2 hours ago', status: 'active', license: 'CPL-PK-2847', phone: '+92-321-4567890' },
  { id: 's2', name: 'Bilal Raza', email: 'bilal.raza@pilot.pk', avatar: 'BR', course: 'JOC', progress: 30, lastActive: '1 day ago', status: 'active', license: 'CPL-PK-3102', phone: '+92-300-9876543' },
  { id: 's3', name: 'Sana Mirza', email: 'sana.mirza@pilot.pk', avatar: 'SM', course: 'A-320', progress: 12, lastActive: '3 days ago', status: 'active', license: 'CPL-PK-2965', phone: '+92-333-2345678' },
  { id: 's4', name: 'Omar Farooq', email: 'omar.farooq@pilot.pk', avatar: 'OF', course: 'SIM', progress: 100, lastActive: '5 days ago', status: 'completed', license: 'CPL-PK-2711', phone: '+92-315-6789012' },
  { id: 's5', name: 'Hina Baig', email: 'hina.baig@pilot.pk', avatar: 'HB', course: 'MCC', progress: 45, lastActive: '12 hours ago', status: 'active', license: 'CPL-PK-3234', phone: '+92-342-3456789' },
  { id: 's6', name: 'Tariq Mehmood', email: 'tariq.m@pilot.pk', avatar: 'TM', course: 'JOC', progress: 80, lastActive: '4 hours ago', status: 'active', license: 'CPL-PK-2789', phone: '+92-305-4567890' },
  { id: 's7', name: 'Zara Sheikh', email: 'zara.sheikh@pilot.pk', avatar: 'ZS', course: 'A-320', progress: 5, lastActive: '1 week ago', status: 'inactive', license: 'CPL-PK-3401', phone: '+92-321-5678901' },
  { id: 's8', name: 'Kamran Ali', email: 'kamran.ali@pilot.pk', avatar: 'KA', course: 'MCC', progress: 90, lastActive: '30 min ago', status: 'active', license: 'CPL-PK-2634', phone: '+92-300-6789012' },
];

export const activities = [
  { id: 1, type: 'video', text: 'Completed: Crew Resource Management Fundamentals', time: '2 hours ago', course: 'MCC' },
  { id: 2, type: 'login', text: 'Logged into Zainco International platform', time: '2 hours ago', course: null },
  { id: 3, type: 'quiz', text: 'Passed quiz: Standard Operating Procedures', time: '1 day ago', course: 'MCC' },
  { id: 4, type: 'video', text: 'Completed: Jet Aerodynamics & High-Speed Flight', time: '2 days ago', course: 'JOC' },
  { id: 5, type: 'video', text: 'Started: Threat and Error Management', time: '2 days ago', course: 'MCC' },
  { id: 6, type: 'achievement', text: 'Earned badge: First Lesson Complete', time: '3 days ago', course: null },
  { id: 7, type: 'video', text: 'Completed: High-Altitude Operations & Pressurization', time: '4 days ago', course: 'JOC' },
  { id: 8, type: 'login', text: 'Logged into Zainco International platform', time: '4 days ago', course: null },
  { id: 9, type: 'quiz', text: 'Completed: Introduction to Multi-Crew Operations', time: '5 days ago', course: 'MCC' },
  { id: 10, type: 'login', text: 'First login — Welcome to Zainco International!', time: '1 week ago', course: null },
];

export const weeklyStats = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 90 },
  { day: 'Wed', minutes: 30 },
  { day: 'Thu', minutes: 120 },
  { day: 'Fri', minutes: 75 },
  { day: 'Sat', minutes: 0 },
  { day: 'Sun', minutes: 60 },
];

export const achievements = [
  { id: 'a1', title: 'First Flight', description: 'Completed your first lesson', icon: 'Plane', unlocked: true },
  { id: 'a2', title: 'Early Bird', description: 'Logged in 5 days in a row', icon: 'Sunrise', unlocked: true },
  { id: 'a3', title: 'Half Throttle', description: 'Reached 50% on any course', icon: 'Gauge', unlocked: true },
  { id: 'a4', title: 'MCC Initiate', description: 'Started MCC course', icon: 'Users', unlocked: true },
  { id: 'a5', title: 'Full Throttle', description: 'Completed any course 100%', icon: 'Trophy', unlocked: false },
  { id: 'a6', title: 'Night Shift', description: 'Studied after midnight', icon: 'Moon', unlocked: false },
  { id: 'a7', title: 'Simulator Ready', description: 'Finished all briefing modules', icon: 'Monitor', unlocked: false },
  { id: 'a8', title: 'Type Rated', description: 'Completed A-320 systems course', icon: 'Award', unlocked: false },
];
