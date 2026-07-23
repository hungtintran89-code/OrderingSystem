package ordersystem.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.logging.Logger;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		say() ;
		SpringApplication.run(BackendApplication.class, args);
	}

	public static void say(){
		System.out.println("hi");

	}



}
