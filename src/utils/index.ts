import axios from "axios";
import { configDotenv } from "dotenv";
import { Request, Response } from "express";
import mongoose, { SortOrder } from "mongoose";
import { usersModel } from "src/models/user/user-schema";
import jwt from "jsonwebtoken";
import jwkToPem  from 'jwk-to-pem';
configDotenv();

const { AWS_REGION, AWS_BUCKET_NAME } = process.env;

export const checkValidAdminRole = (req: Request, res: Response, next: any) => {
  const { role } = req.headers;
  if (role !== "admin") return res.status(403).json({ success: false, message: "Invalid role" });
  else return next();
};
export async function verifyAppleToken(idToken: string) {
  const appleKeys = await axios.get("https://appleid.apple.com/auth/keys");
  const decodedHeader: any = jwt.decode(idToken, { complete: true })?.header;
  const key = appleKeys.data.keys.find((k: any) => k.kid === decodedHeader.kid);
  if (!key) throw new Error("Apple public key not found");
 
  const pubKey = jwkToPem(key);
  const payload: any = jwt.verify(idToken, pubKey, {
    algorithms: ["RS256"],
  });
 
  if (payload.iss !== "https://appleid.apple.com") {
    throw new Error("Invalid Apple token issuer");
  }
 
  return payload;
}

export const checkValidPublisherRole = (req: Request, res: Response, next: any) => {
  const { role } = req.headers;
  if (role !== "publisher") return res.status(403).json({ success: false, message: "Invalid role" });
  else return next();
};

interface Payload {
  description?: string;
  order?: string;
  orderColumn?: string;
}

export const queryBuilder = (payload: Payload, querySearchKeyInBackend = ["name"]) => {
  let { description = "", order = "", orderColumn = "" } = payload;
  const query = description ? { $or: querySearchKeyInBackend.map((key) => ({ [key]: { $regex: description, $options: "i" } })) } : {};
  const sort: { [key: string]: SortOrder } = order && orderColumn ? { [orderColumn]: order === "asc" ? 1 : -1 } : {};

  return { query, sort };
};

export const nestedQueryBuilder = (payload: Payload, querySearchKeyInBackend = ["name"]) => {
  let { description = "", order = "", orderColumn = "" } = payload;

  const queryString = typeof description === "string" ? description : "";

  const query = queryString
    ? {
        $or: querySearchKeyInBackend.flatMap((key) => [
          { [key]: { $regex: queryString, $options: "i" } },
          ...["eng", "kaz", "rus"].map((langKey) => ({
            [`${key}.${langKey}`]: { $regex: queryString, $options: "i" },
          })),
        ]),
      }
    : {};

  const sort: { [key: string]: SortOrder } = order && orderColumn ? { [orderColumn]: order === "asc" ? 1 : -1 } : {};

  return { query, sort };
};

export const toArray = (input: string | string[] | undefined, delimiter: string = ","): string[] => {
  if (!input) return []; // Handle undefined or null input safely
  if (Array.isArray(input)) return input; // If already an array, return as is
  if (typeof input === "string") return input.split(delimiter).map((item) => item.trim()); // Convert comma-separated string to array
  return []; 
};

export const filterBooksByLanguage = (books: any[], languages: string[]): any[] => {
=
  if (!Array.isArray(books) || books.length === 0) return [];
  if (!Array.isArray(languages) || languages.length === 0) return books; // Return all books if no language filter

  // return books.filter((book) => {
  //   if (book.file instanceof Map) {
  //     return languages.some((lang) => book.file.has(lang));
  //   }
 return books.filter((book) => {
    if (book.file instanceof Map) {
      return languages.some((lang) => book.file.has(lang) && book.file.get(lang));
    }
    return false;
  });
};



export const sortBooks = (books: any[], sorting: string, languagePriority: string[] = [], appInterface: any): any[] => {
  switch (sorting?.toLowerCase()) {
    case "rating":
      return books.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

    case "alphabetically":
      return books.sort((a, b) => {
        const nameA = getPrimaryLanguageName(a.name, languagePriority, appInterface);
        const nameB = getPrimaryLanguageName(b.name, languagePriority, appInterface);
        return nameA.localeCompare(nameB);
      });

    case "newest":
      return books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    case "default":
    default:
      return sortByLanguagePriority(books, "file", languagePriority);
  }
};

const getPrimaryLanguageName = (nameObject: Record<string, string>, languagePriority: string[], appInterface: any): string => {
  for (const lang of languagePriority) {
    if (nameObject[lang]) {
      return nameObject[lang];
    }
  }
  // Fallback: Return the first available name if priority languages are missing
  return Object.values(nameObject)[0] || appInterface;
};

export const sortByLanguagePriority = <T>(items: T[], languageKey: keyof T, preferredLanguages: string[]): T[] => {
  if (!Array.isArray(items) || !preferredLanguages?.length) return items;

  const getFileLanguagePriority = (item: T): number => {
    const fileMap = item[languageKey];

    if (!fileMap || !(fileMap instanceof Map)) return 0;

    const availableLanguages = Array.from(fileMap.keys());

    return preferredLanguages.reduce((count, lang) => count + (availableLanguages.includes(lang) ? 1 : 0), 0);
  };

  return items.sort((a, b) => {
    const priorityA = getFileLanguagePriority(a);
    const priorityB = getFileLanguagePriority(b);

    return priorityB - priorityA;
  });
};

export const applyFilters = (data: any[], query: any, language: string = "eng") => {
  const { minRating = 5, sortBy = "createdAt", sortOrder = "desc" } = query;

  // Filter by minimum average rating
  let filteredData = data.filter((item) => item.averageRating >= parseFloat(minRating));

  // Alphabetical sorting by the book name in the chosen language
  filteredData = filteredData.sort((a, b) => {
    const nameA = a.name[language] || a.name["eng"]; // Default to 'eng' if specific language is unavailable
    const nameB = b.name[language] || b.name["eng"];
    return nameA.localeCompare(nameB);
  });

  // Sorting by the specified field (`sortBy`), default is 'createdAt'
  filteredData = filteredData.sort((a, b) => {
    const dateA = new Date(a[sortBy]).getTime();
    const dateB = new Date(b[sortBy]).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Filter based on language presence in the name field
  if (language !== "eng") {
    filteredData = filteredData.filter((item) => item.name[language]); // Exclude items without the specified language name
  }

  return filteredData;
};

export const convertToBoolean = (value: string) => {
  if (value === "true") return true;
  else if (value === "false") return false;
  else return value;
};

export const increaseReferredCountAndCredits = async (id: mongoose.Types.ObjectId) => {
  await usersModel.findByIdAndUpdate(id, { $inc: { referredCount: 1, creditsLeft: 10 } });
};


export const notificationMessages: any = {
  eng: {
    Author_Created: {
      title: "Author Created",
      description: "A new author has been created successfully.",
    },
    TASK_REJECTED: {
      title: "Task Rejected",
      description: "Your submitted task did not pass. Please try again.",
    },
    JOB_SHORTLISTED: {
      title: "Job Shortlisted",
      description: "Congratulations! Your application has been shortlisted.",
    },
    JOB_REJECTED: {
      title: "Job Rejected",
      description: "Unfortunately, your job application was not successful.",
    },
    JOB_ALERT: {
      title: "New Job Alert",
      description: "New job opportunities are available. Check them out!",
    },
    MILESTONE_UNLOCKED: {
      title: "Milestone Unlocked",
      description: "Great work! You’ve unlocked a new milestone.",
    },
    SUBSCRIPTION_STARTED: {
      title: "Subscription Started",
      description: "Your subscription is now active. Enjoy the benefits!",
    },
    SUBSCRIPTION_RENEWED: {
      title: "Subscription Renewed",
      description: "Your subscription has been successfully renewed.",
    },
    SUBSCRIPTION_FAILED: {
      title: "Payment Failed",
      description: "Your subscription payment could not be processed.",
    },
    SUBSCRIPTION_CANCELLED: {
      title: "Subscription Cancelled",
      description: "Your subscription has been cancelled.",
    },
  },
  kaz: {
    Author_Created: {
      title: "Автор Создан",
      description: "Новый автор был успешно создан.",
    },
    TASK_REJECTED: {
      title: "Taak Afgewezen",
      description:
        "Je ingediende taak is niet goedgekeurd. Probeer het opnieuw.",
    },
    JOB_SHORTLISTED: {
      title: "Vacature Geselecteerd",
      description: "Gefeliciteerd! Je sollicitatie is geselecteerd.",
    },
    JOB_REJECTED: {
      title: "Vacature Afgewezen",
      description: "Helaas is je sollicitatie niet succesvol geweest.",
    },
    JOB_ALERT: {
      title: "Nieuwe Vacature",
      description: "Nieuwe vacatures zijn beschikbaar. Bekijk ze nu!",
    },
    MILESTONE_UNLOCKED: {
      title: "Mijlpaal Behaald",
      description: "Goed gedaan! Je hebt een nieuwe mijlpaal behaald.",
    },
    SUBSCRIPTION_STARTED: {
      title: "Abonnement Gestart",
      description: "Je abonnement is nu actief. Veel plezier!",
    },
    SUBSCRIPTION_RENEWED: {
      title: "Abonnement Vernieuwd",
      description: "Je abonnement is succesvol verlengd.",
    },
    SUBSCRIPTION_FAILED: {
      title: "Betaling Mislukt",
      description: "Je abonnementsbetaling kon niet worden verwerkt.",
    },
    SUBSCRIPTION_CANCELLED: {
      title: "Abonnement Geannuleerd",
      description: "Je abonnement is geannuleerd.",
    },
  },
  rus: {
    Author_Created: {
      title: "Автор Создан",
      description: "Новый автор был успешно создан.",
    },
    TASK_REJECTED: {
      title: "Задача Отклонена",
      description: "Ваша задача не была принята. Попробуйте еще раз.",
    },
    JOB_SHORTLISTED: {
      title: "Кандидатура Отобрана",
      description: "Поздравляем! Ваша кандидатура была отобрана.",
    },
    JOB_REJECTED: {
      title: "Кандидатура Отклонена",
      description: "К сожалению, ваша кандидатура не была принята.",
    },
    JOB_ALERT: {
      title: "Новая Вакансия",
      description:
        "Доступны новые вакансии. Ознакомьтесь с ними!",
    },
    MILESTONE_UNLOCKED: {
      title: "Этап Достигнут",
      description: "Поздравляем! Вы достигли нового этапа.",
    },
    SUBSCRIPTION_STARTED: {
      title: "Подписка Начата",
      description: "Ваша подписка теперь активна. Наслаждайтесь преимуществами!",
    },
    SUBSCRIPTION_RENEWED: {
      title: "Подписка Продлена",
      description: "Ваша подписка была успешно продлена.",
    },
    SUBSCRIPTION_FAILED: {
      title: "Paiement Échoué",
      description: "Votre paiement d’abonnement n’a pas pu être traité.",
    },
    SUBSCRIPTION_CANCELLED: {
      title: "Abonnement Annulé",
      description: "Votre abonnement a été annulé.",
    },
  },
  es: {
    TASK_COMPLETED: {
      title: "Tarea Completada",
      description: "Has desbloqueado una nueva tarea. ¡Sigue así!",
    },
    TASK_REJECTED: {
      title: "Tarea Rechazada",
      description: "Tu tarea enviada no fue aprobada. Intenta de nuevo.",
    },
    JOB_SHORTLISTED: {
      title: "Solicitud Seleccionada",
      description: "¡Felicidades! Tu solicitud ha sido preseleccionada.",
    },
    JOB_REJECTED: {
      title: "Solicitud Rechazada",
      description: "Desafortunadamente, tu solicitud no fue aceptada.",
    },
    JOB_ALERT: {
      title: "Nueva Oferta de Trabajo",
      description:
        "Hay nuevas oportunidades de empleo disponibles. ¡Revisa ahora!",
    },
    MILESTONE_UNLOCKED: {
      title: "Hito Alcanzado",
      description: "¡Bien hecho! Has alcanzado un nuevo hito.",
    },
    SUBSCRIPTION_STARTED: {
      title: "Suscripción Iniciada",
      description: "Tu suscripción está activa. ¡Disfruta los beneficios!",
    },
    SUBSCRIPTION_RENEWED: {
      title: "Suscripción Renovada",
      description: "Tu suscripción se ha renovado con éxito.",
    },
    SUBSCRIPTION_FAILED: {
      title: "Pago Fallido",
      description: "No se pudo procesar el pago de tu suscripción.",
    },
    SUBSCRIPTION_CANCELLED: {
      title: "Suscripción Cancelada",
      description: "Tu suscripción ha sido cancelada.",
    },
  },
};