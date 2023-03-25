import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CurrentWeatherRes,
  HourlyRes,
  IPRes,
  RestructuredHourlyForecast,
  SearchRes,
} from './shared.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  fetchIPData(): Observable<IPRes> {
    return this.http.get<IPRes>(environment.IP_API);
  }

  fetchHourlyForecast(
    limit: number,
    lat: number,
    lon: number,
    ...arg: string[]
  ): Observable<RestructuredHourlyForecast[]> {
    return this.http
      .get<HourlyRes>(
        environment.METEO_WEATHER_API +
          `?forecast_days=8&latitude=${lat}&longitude=${lon}&timezone=auto&current_weather=true&hourly=${arg.join(
            ','
          )}&daily=sunset,sunrise`
      )
      .pipe(
        map((res) => {
          return this.mapHourlyData(res, limit);
        })
      );
  }

  mapHourlyData(res: HourlyRes, limit: number): RestructuredHourlyForecast[] {
    const hourlyForecast: RestructuredHourlyForecast[] = [];
    const currentHour: number = new Date(res.current_weather.time).getTime();
    const timeLimit: number = limit * 60 * 60 * 1000;

    res.hourly.time.forEach((time, index) => {
      const milliseconds = new Date(time).getTime();
      if (
        milliseconds >= currentHour &&
        milliseconds < currentHour + timeLimit
      ) {
        const date: Date = new Date(time);
        const sunrise: Date = new Date(
          res.daily.sunrise[Math.floor(index / 24)]
        );
        const sunset: Date = new Date(res.daily.sunset[Math.floor(index / 24)]);

        const day: 'sunny' | 'night' =
          date < sunset && date >= sunrise ? 'sunny' : 'night';

        hourlyForecast.push({
          time: new Date(time).getHours(),
          temperature_2m: res.hourly.temperature_2m[index],
          weathercode: res.hourly.weathercode[index],
          day,
        });
      }
    });

    return hourlyForecast;
  }

  fetchCurrentWeather(location: SearchRes): Observable<CurrentWeatherRes> {
    return this.http.get<CurrentWeatherRes>(
      environment.METEO_WEATHER_API +
        `?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&timezone=auto`
    );
  }

  fetchLocation(key: string): Observable<SearchRes[]> {
    return this.http.get<SearchRes[]>(
      `${environment.SEARCH_API}?key=${environment.SEARCH_API_KEY}&q=${key}`
    );
  }
}
