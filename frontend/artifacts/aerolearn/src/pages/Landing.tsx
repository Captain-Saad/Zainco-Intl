import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Users, Plane, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/shared/Button";
import { courses, Course } from "@/data/mockData";
import CourseInfoModal from "@/components/shared/CourseInfoModal";

export default function Landing() {
  const [, setLocation] = useLocation();
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
            className="mt-16 lg:mt-0"
          >

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-3">
              ELEVATE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">AVIATION CAREER</span>
              <span className="block text-lg md:text-xl lg:text-2xl mt-1 font-medium tracking-wide text-foreground/90">
                With Our Comprehensive <br className="md:hidden" />
                <span className="text-accent text-glow-blue font-bold">Preparation Program!</span>
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xl leading-relaxed">
              Are you a Commercial Pilot License holder looking to join an airline that operates A-320 aircraft? We understand the challenges of gaining the necessary experience and training. That's why we're excited to introduce our Multi Crew Cooperation (MCC) and Jet Orientation Course (JOC), preparation program specifically designed for aspiring pilots in Pakistan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="font-display tracking-widest"
                onClick={() => setLocation("/enroll")}
              >
                ENROLL NOW
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                className="font-display tracking-widest"
                onClick={() => {
                  document.getElementById("program")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                VIEW PROGRAM
              </Button>
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

      {/* What We Offer Section */}
      <section className="bg-secondary/30 border-y border-border-gold/50 relative z-20 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="w-[92%] max-w-[1800px] mx-auto px-6">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-display font-bold mb-4 tracking-wide uppercase">What We Offer</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-50" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                title: "MCC and JOC Preparation",
                desc: "Gain essential skills needed for successful multi-crew operations.",
                icon: Users
              },
              {
                title: "A-320 Procedure Training",
                desc: "Specialized training tailored specifically for the A-320 Procedure.",
                icon: BookOpen
              },
              {
                title: "Multi-Crew Simulator Training",
                desc: "50 hours of Simulator Practice Sessions: Get hands-on experience in a controlled environment, enhancing your confidence and competence.",
                icon: Plane
              }
            ].map((offer, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <offer.icon size={28} className="text-primary drop-shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3 text-glow-gold">{offer.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{offer.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="program" className="py-32 relative">
        <div className="w-[92%] max-w-[1800px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">TRAINING MODULES</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive curriculum designed by airline captains to bridge the gap between basic flight training and commercial jet operations.</p>
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
