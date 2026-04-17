import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Users, Plane, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/shared/Button";
import { courses, Course } from "@/data/mockData";
import CourseInfoModal from "@/components/shared/CourseInfoModal";

export default function Landing() {
  const [altitude, setAltitude] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const pending = sessionStorage.getItem("scrollTo");
    if (pending) {
      sessionStorage.removeItem("scrollTo");
      setTimeout(() => {
        document.getElementById(pending)?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, []);

  useEffect(() => {
    const target = 35000;
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    const increment = target / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAltitude(target);
        clearInterval(timer);
      } else {
        setAltitude(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="grain-overlay" />
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Radar Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-[800px] h-[800px] border border-accent/20 rounded-full absolute" />
          <div className="w-[600px] h-[600px] border border-accent/20 rounded-full absolute" />
          <div className="w-[400px] h-[400px] border border-accent/20 rounded-full absolute" />
          <div className="w-full h-[1px] bg-accent/20 absolute" />
          <div className="h-full w-[1px] bg-accent/20 absolute" />
          <div className="radar-bg" />
        </div>

        <div className="w-[92%] max-w-[1800px] mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-24 lg:mt-0"
          >
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono tracking-widest animate-pulse">
              LIMITED — 10 SEATS ONLY
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              ELEVATE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">AVIATION CAREER</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Pakistan's Premier A-320 MCC & JOC Preparation Program. Transition seamlessly from CPL to the airline flight deck.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/enroll">
                <Button size="lg" className="font-display tracking-widest">ENROLL NOW</Button>
              </Link>
              <Button variant="secondary" size="lg" className="font-display tracking-widest">VIEW PROGRAM</Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl -z-10" />
            <img 
              src={`${import.meta.env.BASE_URL}images/a320-wireframe.png`}
              alt="A320 Wireframe" 
              className="w-full object-contain filter drop-shadow-[0_0_30px_rgba(14,165,233,0.3)]"
            />
            
            {/* Altitude HUD */}
            <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 glass-card p-4 rounded-xl border-l-4 border-l-accent flex items-center gap-4">
              <div className="h-16 w-1 bg-accent/30 relative">
                <div className="absolute bottom-1/2 w-full h-2 bg-accent transform translate-y-1/2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">ALTITUDE (FT)</p>
                <p className="text-3xl font-mono text-accent text-glow-blue">
                  {altitude.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="w-full bg-secondary border-y border-border-gold relative z-20">
        <div className="w-[92%] max-w-[1800px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50 HRS", label: "Simulator Training" },
            { value: "10", label: "Exclusive Seats" },
            { value: "A-320", label: "Type Certified" },
            { value: "CPL", label: "Focused Curriculum" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center border-r border-border last:border-0"
            >
              <div className="text-3xl md:text-4xl font-mono text-accent text-glow-blue mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Programs Section */}
      <section id="program" className="py-32 relative">
        <div className="w-[92%] max-w-[1800px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">TRAINING MODULES</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive curriculum designed by active airline captains to bridge the gap between basic flight training and commercial jet operations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "MCC Training", icon: Users, course: courses.find(c => c.id === '1') },
              { title: "JOC Course", icon: Plane, course: courses.find(c => c.id === '2') },
              { title: "A-320 Procedures", icon: BookOpen, course: courses.find(c => c.id === '3') }
            ].map((prog, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="glass-card p-8 hud-brackets group cursor-pointer border-glow-gold"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <prog.icon size={28} />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">{prog.title}</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">{prog.course?.description}</p>
                <button 
                  onClick={() => prog.course && setSelectedCourse(prog.course)}
                  className="flex items-center text-primary font-semibold group-hover:text-primary-foreground group-hover:bg-primary px-4 py-2 rounded transition-all w-fit border-none bg-transparent"
                >
                  LEARN MORE <ChevronRight size={18} className="ml-1" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights ZigZag */}
      <section className="py-20 bg-secondary/50 border-t border-border-gold/50 relative overflow-hidden">
        <div className="w-[92%] max-w-[1800px] mx-auto px-6">
          {[
            { num: "01", course: courses.find(c => c.id === '1'), align: "left", image: "mcc-pilots.jpg" },
            { num: "02", course: courses.find(c => c.id === '2'), align: "right", image: "joc-airplane.png" },
            { num: "03", course: courses.find(c => c.id === '4'), align: "left", image: "sim-cockpit.jpg" }
          ].map((item, i) => {
            if (!item.course) return null;
            return (
            <div key={i} className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-32 last:mb-0 ${item.align === 'right' ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1 relative">
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50" />
                <img 
                  src={`${import.meta.env.BASE_URL}images/${item.image}`} 
                  alt={item.title} 
                  className="rounded-2xl border border-border relative z-10 w-full object-cover aspect-video shadow-2xl"
                />
              </div>
              <div className="flex-1 relative">
                <div className="absolute -top-20 -left-10 text-[150px] font-display font-bold text-primary/5 pointer-events-none select-none z-0">
                  {item.num}
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-display font-bold mb-4">{item.course.title}</h3>
                  <p className="text-lg text-muted-foreground mb-6">{item.course.description}</p>
                  <ul className="space-y-3">
                    {item.course.highlights.map((highlight, n) => (
                      <li key={n} className="flex items-start gap-3 text-sm text-foreground">
                        <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                        <span className="leading-snug">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </section>

      {/* Instructor Section */}
      <section id="instructors" className="py-32 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-display font-bold mb-12">LEARN FROM THE BEST</h2>
          <div className="glass-card p-10 rounded-2xl border-t-4 border-t-primary inline-block w-full">
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-primary p-1 mb-6">
              {/* placeholder instructor portrait Unsplash */}
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop" 
                alt="Lead Instructor"
                className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-3xl font-display font-bold mb-2">Capt. Zainul Abidin</h3>
            <p className="text-accent font-mono mb-6">LEAD FLIGHT INSTRUCTOR</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>ATPL Holder</span>
              <span className="text-primary">•</span>
              <span>8,500+ Flight Hours</span>
              <span className="text-primary">•</span>
              <span>A-320 Type Rated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020810] pt-16 pb-8 border-t border-primary/20">
        <div className="w-[92%] max-w-[1800px] mx-auto px-6 grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Zainco Logo" className="w-14 h-14 object-contain" />
              <span className="font-display font-bold text-xl tracking-widest text-foreground">ZAINCO<span className="text-primary"> INTL</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Elevating the standard of aviation training in Pakistan. Preparing the next generation of airline pilots.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">QUICK LINKS</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#program" className="hover:text-primary transition-colors">Program Details</a></li>
              <li><Link href="/enroll" className="hover:text-primary transition-colors">Admissions</Link></li>
              <li><a href="#instructors" className="hover:text-primary transition-colors">Instructors</a></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Student Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">CONTACT</h4>
            <div className="text-sm text-muted-foreground space-y-2 font-mono">
              <p>Email: zainco747@gmail.com</p>
              <p>Phone: +92 321 9230301</p>
              <p>Location: DHA Phase 8, Lahore, Pakistan</p>
            </div>
          </div>
        </div>
        <div className="w-[92%] max-w-[1800px] mx-auto px-6 pt-8 border-t border-white/5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zainco International Aviation Academy. All rights reserved.
        </div>
      </footer>

      {selectedCourse && (
        <CourseInfoModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
