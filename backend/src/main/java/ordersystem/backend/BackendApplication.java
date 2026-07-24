package ordersystem.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.logging.Logger;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		say() ;
		say2();
		say3() ;
		SpringApplication.run(BackendApplication.class, args);
	}

	public static void say() {
		System.out.println("hi");
	}

	public  static void say2(){
		System.out.println("hello");
	}

	public static void say3(){
		System.out.println("nguong mo anh thong vcll");
	}




}
