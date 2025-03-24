import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperInstance } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export const PyoPluginSwiperPreview = () => {
	return (
		<div className='pyo-panel pyo-panel-flex-wrap'>
			<Swiper
				modules={[Navigation, Pagination, Autoplay]}
				spaceBetween={50}
				slidesPerView={3}
				navigation
				pagination={{ clickable: true }}
				autoplay={{ delay: 2000, disableOnInteraction: false }}
				loop={true}
				onSlideChange={() => console.log('slide change')}
				onSwiper={(swiper: SwiperInstance) => console.log(swiper)}
			>
				<SwiperSlide style={{ height: '300px', background: 'red' }}>Slide 1</SwiperSlide>
				<SwiperSlide style={{ height: '300px', background: 'orange' }}>Slide 2</SwiperSlide>
				<SwiperSlide style={{ height: '300px', background: 'yellow' }}>Slide 3</SwiperSlide>
				<SwiperSlide style={{ height: '300px', background: 'green' }}>Slide 4</SwiperSlide>
				<SwiperSlide style={{ height: '300px', background: 'blue' }}>Slide 5</SwiperSlide>
			</Swiper>
		</div>
	);
};
