"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import CustomFormField from "../CustomFormField"
import SubmitButton from "../SubmitButton"
import { useState } from "react"
import { getAppointmentSchema } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { FormFieldType } from "./PatientForm"
import { SelectItem } from "../ui/select"
import Image from "next/image"
import { Doctors } from "@/constants"
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions"
import { Appointment } from "@/types/appwrite.types"
import emailjs from "@emailjs/browser"

const AppointmentForm = ({ type, userId, patientId, appointment, setOpen }: {
    type: "create" | "cancel" | "schedule",
    userId: string;
    patientId: string;
    appointment?: Appointment;
    setOpen?: (open: boolean) => void;
}) => {
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()

    const AppointmentFormValidation = getAppointmentSchema(type);

    const form = useForm<z.infer<typeof AppointmentFormValidation>>({
        resolver: zodResolver(AppointmentFormValidation),
        defaultValues: {
            primaryPhysician: appointment ? appointment.primaryPhysician : "",
            schedule: appointment ? new Date(appointment?.schedule) : new Date(Date.now()),
            reason: appointment ? appointment.reason : "",
            note: appointment ? appointment.note : "",
            cancellationReason: appointment?.cancellationReason || "",
        },
    });

    const sendEmailNotification = async (content:string) => {
        await emailjs
            .send(
                process.env.NEXT_PUBLIC_SERVICEID! || "",
                process.env.NEXT_PUBLIC_TEMPLATEID! || "",
                {
                    from_name: "Arialmed",
                    from_email: "mikearial@icloud.com",
                    to_name: "Mike",
                    to_email: "mikearial@icloud.com",
                    message: content,
                },
                process.env.NEXT_PUBLIC_APIKEY
            )
    }


    async function onSubmit(values: z.infer<typeof AppointmentFormValidation>) {
        setIsLoading(true)

        let status;
        switch (type) {
            case "schedule":
                status = "scheduled";
                break;
            case "cancel":
                status = "cancelled";
                break;
            default:
                status = "pending"
                break;
        }

        try {
            if (type === "create" && patientId) {
                const appointmentData = {
                    userId,
                    patient: patientId,
                    primaryPhysician: values.primaryPhysician,
                    schedule: new Date(values.schedule),
                    reason: values.reason!,
                    note: values.note,
                    status: status as Status,
                }
                const appointment = await createAppointment(appointmentData);

                if (appointment) {
                    form.reset(),
                        router.push(`/patients/${userId}/new-appointment/success?appointmentId=${appointment.$id}`)
                }
            } else {
                const appointmentToUpdate = {
                    userId,
                    appointmentId: appointment?.$id!,
                    appointment: {
                        primaryPhysician: values.primaryPhysician,
                        schedule: new Date(values?.schedule),
                        status: status as Status,
                        cancellationReason: values?.cancellationReason,
                    },
                    type,
                };

                const updatedAppointment = await updateAppointment(appointmentToUpdate)

                if (updatedAppointment) {
                    const message = `Greetings from Arialmed. ${type === "schedule" ? `Your appointment has been confirmed from one of our doctors. Please come in at your scheduled time.` : `We regret to inform you that your appointment has been cancelled. Reason: ${values.cancellationReason}. If you have any questions, please don't hesitate to contact us.`}`;
                    await sendEmailNotification(message);

                    setOpen && setOpen(false);
                    form.reset();
                }
            }
            
        } catch (error) {
            console.log(error);
        }

        setIsLoading(false);
    }

    let buttonLabel;

    switch (type) {
        case "cancel":
            buttonLabel = "Cancel Appointment";
            break;
        case "create":
            buttonLabel = "Create Appointment";
        case "schedule":
            buttonLabel = "Schedule Appointment";
        default:
            break;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
                {type === "create" && <section className="mb-12 space-y-4 pt-10">
                    <h1 className="header">New Appointment</h1>
                    <p className="text-dark-700">Request a new appointment in 10 seconds.</p>
                </section>
                }

                {type !== "cancel" && (
                    <>
                        <CustomFormField
                            control={form.control}
                            fieldType={FormFieldType.SELECT}
                            name="primaryPhysician"
                            label="Doctor"
                            placeholder="Select a doctor"
                        >
                            {Doctors.map((doctor) => (
                                <SelectItem key={doctor.name} value={doctor.name}>
                                    <div className="flex cursor-pointer items-center gap-2">
                                        <Image
                                            src={doctor.image}
                                            width={32}
                                            height={32}
                                            alt={doctor.name}
                                            className="rounded-full border border-dark-500"
                                        />
                                        <p>{doctor.name}</p>
                                    </div>
                                </SelectItem>
                            ))}
                        </CustomFormField>

                        <CustomFormField
                            control={form.control}
                            fieldType={FormFieldType.DATE_PICKER}
                            name="schedule"
                            label="Expected appointment date"
                            placeholder="Select your appointment date"
                            showTimeSelect
                            dateFormat="MM/dd/yyyy - h:mm aa"
                        />

                        <div className="flex flex-col gap-6 xl:flex-row">
                            <CustomFormField
                                control={form.control}
                                fieldType={FormFieldType.TEXTAREA}
                                name="reason"
                                label="Reason for appointment"
                                placeholder="Please provide a reason for your appointment"
                            />

                            <CustomFormField
                                control={form.control}
                                fieldType={FormFieldType.TEXTAREA}
                                name="note"
                                label="Additional comments/notes"
                                placeholder="Please provide any additional comments or notes"
                            />
                        </div>
                    </>
                )}

                {type === "cancel" && (
                    <CustomFormField
                        control={form.control}
                        fieldType={FormFieldType.TEXTAREA}
                        name="cancellationReason"
                        label="Reason for cancellation"
                        placeholder="Please provide a reason for cancellation"
                    />
                )}

                <SubmitButton
                    isLoading={isLoading}
                    className={`${type === 'cancel' ? 'shad-danger-btn' : 'shad-primary-btn'} w-full`}
                >
                    {buttonLabel}
                </SubmitButton>
            </form>
        </Form>
    )
}


export default AppointmentForm;