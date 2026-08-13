import cv2


class DroneStream:

    def __init__(self):

        self.cap = None
        self.source = None


    def connect(self, source=0):

        self.source = source

        self.cap = cv2.VideoCapture(source)


        if self.cap.isOpened():

            print(
                f"Video source connected: {source}"
            )

            return True


        print(
            "Unable to connect video source"
        )

        return False



    def get_frame(self):

        if self.cap is None:

            return None


        success, frame = self.cap.read()


        if not success:

            return None


        return frame



    def disconnect(self):

        if self.cap:

            self.cap.release()

            self.cap = None

            print(
                "Video source disconnected"
            )