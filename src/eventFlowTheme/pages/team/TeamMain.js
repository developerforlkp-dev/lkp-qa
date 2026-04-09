"use client";
import React from "react"; // Add useState here
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import TeamImg1 from '../../assets/images/team/team-1-1.jpg'
import TeamImg2 from '../../assets/images/team/team-1-2.jpg'
import TeamImg3 from '../../assets/images/team/team-1-3.jpg'
import TeamImg4 from '../../assets/images/team/team-1-4.jpg'
import TeamImg5 from '../../assets/images/team/team-1-5.jpg'
import TeamImg6 from '../../assets/images/team/team-1-6.jpg'

const teamMembers = [
  {
    name: "David Beckham",
    role: "Speaker",
    img: TeamImg1,
    description:
      "Events bring people together for shared experience and celebration. Weddings and birthdays to conferences, festivals, events create memories.",
  },
  {
    name: "David Betman",
    role: "Singer",
    img: TeamImg2,
    description:
      "Events bring people together for shared experience and celebration. Weddings and birthdays to conferences, festivals, events create memories.",
  },
  {
    name: "Jessica Brown",
    role: "Content Creator",
    img: TeamImg3,
    description:
      "Events bring people together for shared experience and celebration. Weddings and birthdays to conferences, festivals, events create memories.",
  },
  {
    name: "David Beckham",
    role: "Speaker",
    img: TeamImg4,
    description:
      "Events bring people together for shared experience and celebration. Weddings and birthdays to conferences, festivals, events create memories.",
  },
  {
    name: "Alisha Martin",
    role: "Singer",
    img: TeamImg5,
    description:
      "Events bring people together for shared experience and celebration. Weddings and birthdays to conferences, festivals, events create memories.",
  },
  {
    name: "Herbert Spin",
    role: "Content Creator",
    img: TeamImg6,
    description:
      "Events bring people together for shared experience and celebration. Weddings and birthdays to conferences, festivals, events create memories.",
  },
];
export default function Home() {
  return (

          <section className="team-page">
            <div className="container">
              <div className="row">
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className={`col-xl-4 col-lg-6 col-md-6 wow fadeIn${
                      index % 2 === 0 ? "Left" : "Right"
                    }`}
                    data-wow-delay={`${(index + 1) * 100}ms`}
                  >
                    <div className="team-one__single">
                      <div className="team-one__img-box">
                        <div className="team-one__img">
                          <img src={member.img} alt={member.name} />
                          <div className="team-one__content">
                            <h4 className="team-one__name">
                              <Link to="team-details">{member.name}</Link>
                            </h4>
                            <p className="team-one__sub-title">{member.role}</p>
                          </div>
                          <div className="team-one__content-hover">
                            <h4 className="team-one__name-hover">
                              <Link to="team-details">{member.name}</Link>
                            </h4>
                            <p className="team-one__sub-title-hover">
                              {member.role}
                            </p>
                            <p className="team-one__text-hover">
                              {member.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>


  );
}
