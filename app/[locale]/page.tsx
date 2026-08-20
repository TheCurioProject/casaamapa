import { Hero } from '@/components/sections/hero';
import { Stairs } from '@/components/sections/stairs';
import { Apts } from '@/components/sections/apts';
import { Amenities } from '@/components/sections/amenities';
import { Leyenda } from '@/components/sections/leyenda';
import { Location } from '@/components/sections/location';
import { Chacala } from '@/components/sections/chacala';

export default function HomePage() {
  return (
    <main id="experience">
      <Hero />
      <Stairs />
      <Apts />
      <Amenities />
      <Leyenda />
      <Location />
      <Chacala />
    </main>
  );
}
