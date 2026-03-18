package com.hmcinemas.service;

import com.hmcinemas.model.Movie;
import com.hmcinemas.model.Seat;
import com.hmcinemas.model.Showtime;
import com.hmcinemas.repository.MovieRepository;
import com.hmcinemas.repository.SeatRepository;
import com.hmcinemas.repository.ShowtimeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;

    public DataSeeder(MovieRepository movieRepository, ShowtimeRepository showtimeRepository, SeatRepository seatRepository) {
        this.movieRepository = movieRepository;
        this.showtimeRepository = showtimeRepository;
        this.seatRepository = seatRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (movieRepository.count() == 0) {
            // Add Movies
            Movie m1 = new Movie();
            m1.setTitle("Inception");
            m1.setGenre("Sci-Fi");
            m1.setDuration(148);
            m1.setImageUrl("https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg");
            movieRepository.save(m1);

            Movie m2 = new Movie();
            m2.setTitle("Interstellar");
            m2.setGenre("Sci-Fi");
            m2.setDuration(169);
            m2.setImageUrl("https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg");
            movieRepository.save(m2);

            Movie m3 = new Movie();
            m3.setTitle("The Dark Knight");
            m3.setGenre("Action");
            m3.setDuration(152);
            m3.setImageUrl("https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg");
            movieRepository.save(m3);

            // Add Showtimes & Seats for all movies
            for (Movie movie : List.of(m1, m2, m3)) {
                for (String time : List.of("10:00 AM", "01:00 PM", "04:30 PM", "08:00 PM")) {
                    Showtime showtime = new Showtime();
                    showtime.setMovie(movie);
                    showtime.setTimeString(time);
                    showtimeRepository.save(showtime);

                    // Add Seats (A-E rows, 1-8 cols)
                    char[] rows = {'A', 'B', 'C', 'D', 'E'};
                    for (char row : rows) {
                        for (int col = 1; col <= 8; col++) {
                            Seat seat = new Seat();
                            seat.setShowtime(showtime);
                            seat.setSeatNumber(row + "" + col);
                            seat.setBooked(Math.random() > 0.8); // 20% random booked initially
                            seatRepository.save(seat);
                        }
                    }
                }
            }
        }
    }
}
