package com.hmcinemas.controller;

import com.hmcinemas.dto.BookingRequest;
import com.hmcinemas.model.Booking;
import com.hmcinemas.model.Movie;
import com.hmcinemas.model.Seat;
import com.hmcinemas.model.Showtime;
import com.hmcinemas.repository.BookingRepository;
import com.hmcinemas.repository.MovieRepository;
import com.hmcinemas.repository.SeatRepository;
import com.hmcinemas.repository.ShowtimeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;

    public ApiController(MovieRepository movieRepository, ShowtimeRepository showtimeRepository, SeatRepository seatRepository, BookingRepository bookingRepository) {
        this.movieRepository = movieRepository;
        this.showtimeRepository = showtimeRepository;
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/movies")
    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    @GetMapping("/showtimes/{movieId}")
    public List<Showtime> getShowtimes(@PathVariable Long movieId) {
        return showtimeRepository.findByMovieId(movieId);
    }

    @GetMapping("/seats/{showtimeId}")
    public List<Seat> getSeats(@PathVariable Long showtimeId) {
        return seatRepository.findByShowtimeId(showtimeId);
    }

    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request) {
        Optional<Showtime> showtimeOpt = showtimeRepository.findById(request.getShowtimeId());
        if (showtimeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid showtime.");
        }

        Showtime showtime = showtimeOpt.get();
        List<Seat> seats = seatRepository.findByShowtimeId(showtime.getId());
        
        // Verify and book seats
        for (String seatName : request.getSeatNames()) {
            Seat seatToBook = seats.stream().filter(s -> s.getSeatNumber().equals(seatName)).findFirst().orElse(null);
            if (seatToBook == null || seatToBook.isBooked()) {
                return ResponseEntity.badRequest().body("Seat " + seatName + " is invalid or already booked.");
            }
            seatToBook.setBooked(true);
            seatRepository.save(seatToBook);
        }

        Booking booking = new Booking();
        booking.setShowtime(showtime);
        booking.setSeatNames(request.getSeatNames());
        booking.setTotalPrice(request.getSeatNames().size() * 150.0); // 150 INR per seat
        
        Booking savedBooking = bookingRepository.save(booking);
        return ResponseEntity.ok(savedBooking);
    }
}
