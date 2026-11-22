import "@typespec/http";

using TypeSpec.Http;

@service(#{ title: "Calendar Calls API" })
namespace CalendarCalls;

union MeetingDuration {
  15,
  30,
  45,
  60,
  75,
  90,
  105,
  120,
}

model MeetingType {
  @pattern("^[a-z0-9]{3}-[a-z0-9]{5}$")
  id: string;
  name: string;
  description: string;
  duration: MeetingDuration;
}

model CreateMeetingType {
  @minLength(1)
  @maxLength(100)
  name: string;

  @minLength(1)
  @maxLength(1000)
  description: string;

  duration: MeetingDuration;
}

model FieldError {
  field: string;
  message: string;
}

model ValidationErrorResponse {
  message: string;
  errors: FieldError[];
}

model MeetingTypeCreated {
  @statusCode statusCode: 201;
  @body body: MeetingType;
}

model AvailabilitySlot {
  start: utcDateTime;
  end: utcDateTime;
}

model AvailabilityDay {
  date: string;
  freeCount: int32;
}

model Availability {
  days: AvailabilityDay[];
  slots: AvailabilitySlot[];
}

model CreateBooking {
  meetingTypeId: string;
  start: utcDateTime;

  @minLength(1)
  @maxLength(100)
  guestName: string;

  @minLength(1)
  @maxLength(254)
  guestEmail: string;
}

model Booking {
  meetingTypeId: string;
  meetingTypeName: string;
  start: utcDateTime;
  end: utcDateTime;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
}

model BookingCreated {
  @statusCode statusCode: 201;
  @body body: Booking;
}

model ConflictResponse {
  message: string;
}

@error
model BookingConflict {
  @statusCode statusCode: 409;
  @body body: ConflictResponse;
}

model NotFoundResponse {
  message: string;
}

@error
model MeetingTypeNotFound {
  @statusCode statusCode: 404;
  @body body: NotFoundResponse;
}

@error
model ValidationError {
  @statusCode statusCode: 400;
  @body body: ValidationErrorResponse;
}

@route("/api/meeting-types")
interface MeetingTypeOperations {
  @get list(): MeetingType[];
  @get @route("/{id}") read(@path id: string): MeetingType | MeetingTypeNotFound;
  @get @route("/{id}/availability") availability(@path id: string): Availability | MeetingTypeNotFound;
  @post create(@body body: CreateMeetingType): MeetingTypeCreated | ValidationError;
}

@route("/api/bookings")
interface BookingOperations {
  @post create(@body body: CreateBooking): BookingCreated | ValidationError | BookingConflict | MeetingTypeNotFound;
}
