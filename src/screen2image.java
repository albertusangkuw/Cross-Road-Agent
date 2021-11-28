import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.Toolkit;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

public class screen2image {
    SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMdd hh mm ss a");
    static int i = 0;

    public void robo() throws Exception {
        Calendar now = Calendar.getInstance();
        Robot robot = new Robot();
        BufferedImage screenShot = robot.createScreenCapture(new Rectangle(0, 0, 642, 505));
        ImageIO.write(screenShot, "JPG", new File("C:/Users/Albert PC/Documents/Semester 6/AI/tubes/ss/" + i + ".jpg"));
        System.out.println(formatter.format(now.getTime()));
    }
    // 10 Vertical
    // 15 horizontal

    public static void main(String[] args) throws Exception {
        screen2image s2i = new screen2image();
        int maxPics = 1000;
        int miliSeconds = 100;

        while (i < maxPics) {
            s2i.robo();
            Thread.sleep(miliSeconds);
            i++;
        }
    }
}