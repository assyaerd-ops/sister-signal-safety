import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, MapPin, MessageCircle, Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Verified Women Only",
    description: "Every member is ID-verified to ensure a trusted, women-only community.",
  },
  {
    icon: Users,
    title: "Walk-Home Escorts",
    description: "Request a sister to walk with you when you feel unsafe — day or night.",
  },
  {
    icon: MapPin,
    title: "Safe Pickups",
    description: "Get picked up from bad dates, uncomfortable situations, or anywhere you need out.",
  },
  {
    icon: MessageCircle,
    title: "Live Check-ins",
    description: "Share your location with a sister who monitors until you're safe.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="font-display text-xl font-bold text-foreground">SisterSignal</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Join the Circle</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
            >
              <Heart className="h-10 w-10 text-primary" fill="currentColor" />
            </motion.div>
            <h1 className="mb-6 font-display text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl">
              Women Helping Women{" "}
              <span className="text-primary">Stay Safe</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl">
              SisterSignal is a verified, women-only safety network. Request an escort, pickup, or check-in from trusted sisters in your community — in real time.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/signup">Get Started — It's Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="#how-it-works">How It Works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-4xl font-bold text-foreground">How SisterSignal Works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Three simple steps to activate your safety network.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-card-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-border bg-secondary/50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-2xl border border-accent/30 bg-card p-8 md:p-10"
          >
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold text-card-foreground">Safety Disclaimer</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-card-foreground">SisterSignal is not a substitute for emergency services.</strong> If you are in immediate danger, please call 911 (or your local emergency number) first.
              </p>
              <p>
                SisterSignal is a peer-to-peer community tool. We verify identities to the best of our ability, but cannot guarantee the actions of any user. Always trust your instincts and exercise personal judgment.
              </p>
              <p>
                By creating an account, you agree that SisterSignal and its operators are not liable for any incidents that occur during or after use of this platform. Use this service at your own discretion.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 font-display text-4xl font-bold text-foreground">
              Ready to Join the Circle?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Sign up, verify your identity, and start helping — or being helped.
            </p>
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/signup">Create Your Account</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            <span>SisterSignal</span>
          </div>
          <p>Women helping women. Always.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
