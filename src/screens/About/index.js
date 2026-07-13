import React from "react";
import cn from "classnames";
import styles from "./About.module.sass";
import { Home, Compass, Ticket, Star } from "lucide-react";

const About = () => {
  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            Discover the Unseen. Experience the <span className={styles.accentWord}>Extraordinary.</span>
          </h1>
          <p className={styles.subtitle}>
            Little Known Planet is your gateway to the world's best kept secrets. We curate unique 
            stays, immersive experiences, and local events that turn ordinary trips into unforgettable journeys.
          </p>
        </div>

        <div className={styles.content}>
          <p>
            Founded on the belief that travel should be more than just visiting popular landmarks, 
            Little Known Planet was created to connect curious travelers with authentic, local experiences. 
            We meticulously vet every property, host, and event to ensure that when you book with us, 
            you're guaranteed an experience that is both exceptional and uniquely yours.
          </p>
          <p>
            Whether you're looking for a tranquil cabin hidden in the mountains, a hands-on culinary 
            masterclass with a local chef, or exclusive access to an underground music event, we provide 
            the platform that makes discovering and booking these moments seamless.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Home size={32} color="#0097B2" strokeWidth={1.5} />
            </div>
            <h3 className={styles.cardTitle}>Unique Stays</h3>
            <p className={styles.cardText}>
              From luxury treehouses to boutique heritage homes, our curated selection of stays 
              goes beyond the ordinary hotel room. We focus on design, comfort, and extraordinary locations.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Compass size={32} color="#0097B2" strokeWidth={1.5} />
            </div>
            <h3 className={styles.cardTitle}>Immersive Experiences</h3>
            <p className={styles.cardText}>
              Dive deep into the local culture with experiences hosted by passionate experts. 
              Learn new skills, explore hidden trails, and see the world through a local's eyes.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Ticket size={32} color="#0097B2" strokeWidth={1.5} />
            </div>
            <h3 className={styles.cardTitle}>Exclusive Events</h3>
            <p className={styles.cardText}>
              Get front-row access to the most exciting events happening around you. From intimate 
              gatherings to large-scale festivals, we connect you with the pulse of the city.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Star size={32} color="#0097B2" strokeWidth={1.5} />
            </div>
            <h3 className={styles.cardTitle}>Quality Guaranteed</h3>
            <p className={styles.cardText}>
              Every listing on Little Known Planet meets our rigorous standards for quality, 
              safety, and authenticity. Your peace of mind is our top priority.
            </p>
          </div>
        </div>

        <div className={styles.mission}>
          <h2 className={styles.missionTitle}>Our Mission</h2>
          <p className={styles.missionText}>
            To inspire and enable people to explore the world differently, fostering a deeper 
            connection with local communities and creating memories that last a lifetime. 
            We believe that the best stories are found off the beaten path.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
