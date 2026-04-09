import React from 'react';
import Banner from "../home/Banner"
import ServicesOne from '../home/ServicesOne';
import SlidingText from '../home/SlidingText';
import EventOne from '../home/EventOne';
import BuyTicket from '../home/BuyTicket';
import TeamOne from '../home/TeamOne';
import EventDirection from '../home/EventDirection';
import GalleryOne from '../home/GalleryOne';
import ScheduleOne from '../home/ScheduleOne';
import BrandOne from '../home/BrandOne';
import BlogOne from '../home/BlogOne';
import CTAOne from '../home/CTAOne';


const HomeMain = () => {
	return (
		<React.Fragment>
			<Banner />
			<ServicesOne />
			<SlidingText />
			<EventOne />
			<BuyTicket />
			<TeamOne />
			<EventDirection />
			<GalleryOne />
			<ScheduleOne />
			<BrandOne />
			<BlogOne />
			<CTAOne />
		</React.Fragment>
	);
}

export default HomeMain;