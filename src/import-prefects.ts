
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";

type Prefect = {
  name: string;
  form: number;
  className: string;
  outstanding: number;
};

export const prefects: Prefect[] = [
  // FORM 5
  { name: "Abdul Arif Irfan Bin Mohd Zaid", form: 5, className: "5ALF", outstanding: 33 },
  { name: "Ahmad Haris Naqieb Bin Md Shaiful", form: 5, className: "5AZZ", outstanding: 27 },
  { name: "Athirah Nur Hannah Binti Arif Faddilah", form: 5, className: "5ALF", outstanding: 27 },
  { name: "Azib Aqil Syah B Azlan Syah", form: 5, className: "5ANN", outstanding: 0 },
  { name: "Dayana Batrisya Binti Ahmad Hisyamudin", form: 5, className: "5ARR", outstanding: 0 },
  { name: "Insyirah Zulaikha Binti Mohd Zamri", form: 5, className: "5ALF", outstanding: 30 },
  { name: "Izzah Insyirah Binti Muhammad Faizal", form: 5, className: "5AZZ", outstanding: 24 },
  { name: "Muhammad Aidil Daniel Bin Mohammad Rasyidi", form: 5, className: "5ANN", outstanding: 18 },
  { name: "Muhammad Amirul Hazim B Mohd Norhisam", form: 5, className: "5AZZ", outstanding: 33 },
  { name: "Muhammad Amjad Fahmi Bin Md Fadli", form: 5, className: "5ANN", outstanding: 33 },
  { name: "Muhammad Fawwaz Bin Yusof Hilmi", form: 5, className: "5AZZ", outstanding: 33 },
  { name: "Muhammad Haziq Rayyan Bin Mohd Rizwan", form: 5, className: "5ALF", outstanding: 33 },
  { name: "Muhammad Yusuf Haikal Bin Mohd Ishak", form: 5, className: "5ALF", outstanding: 33 },
  { name: "Muhammad Zikrullah Bin Ahmad Wasir", form: 5, className: "5ADD", outstanding: 33 },
  { name: "Nur Afiqah Zakirah Binti Mat Zaid Anua", form: 5, className: "5AZZ", outstanding: 30 },
  { name: "Nur Aisyah Syahirah Binti Ahmad Fairus", form: 5, className: "5AZZ", outstanding: 33 },
  { name: "Nur Damia Binti Mad Zufri", form: 5, className: "5ALF", outstanding: 33 },
  { name: "Nur Fareesyah Binti Mohd Sahrool", form: 5, className: "5AZZ", outstanding: 30 },
  { name: "Nur Nabihah Syukriyyah Binti Rosli", form: 5, className: "5AZZ", outstanding: 33 },
  { name: "Nur Najmiah Adilah Bt Khairul Anuar", form: 5, className: "5ALF", outstanding: 21 },
  { name: "Nuraqilah Husna Binti Mohd Rasydan", form: 5, className: "5ALF", outstanding: 33 },
  { name: "Nurul Iman Binti Fakhrulrazy", form: 5, className: "5ALF", outstanding: 0 },
  { name: "Syed Abdul Rahman Al Idrus B Syed Nazri", form: 5, className: "5ALF", outstanding: 33 },

  // FORM 4
  { name: "Ahmad Afeef Nazhan Bin Mohd Nasir", form: 4, className: "4ALF", outstanding: 33 },
  { name: "Ahmad Alham Rafyqeen Bin Amizul", form: 4, className: "4ALF", outstanding: 33 },
  { name: "AHMAD HAKIM FAIZ BIN AHMAD RIZAL", form: 4, className: "4 ALF", outstanding: 33 },
  { name: "Anis Humaira Najla Binti Annas Trisno", form: 4, className: "4AZZ", outstanding: 33 },
  { name: "Atieya Nur Iffah Binti Azmi", form: 4, className: "4ALF", outstanding: 33 },
  { name: "Muhammad Arif Salihin Bin Mohd Azmi", form: 4, className: "4AZZ", outstanding: 33 },
  { name: "Muhammad Harriz Andhika Bin Sofian", form: 4, className: "4ALF", outstanding: 33 },
  { name: "Nur Adriana Karmila Awatif Binti Mohd Marwan", form: 4, className: "4ALF", outstanding: 24 },
  { name: "Nurul Amalia Binti Nor Anuar", form: 4, className: "4AZZ", outstanding: 33 },
  { name: "Sabiya Rania Bt Sukri", form: 4, className: "4ALF", outstanding: 27 },
  { name: "Sharifah Nur Damia Batrisyia Binti Syed Abdul Rahim", form: 4, className: "4ANN", outstanding: 6 },
  { name: "Syed Ahmed Daqiqi Bin Syed Mohd Hafizuddin", form: 4, className: "4ALF", outstanding: 33 },
  { name: "Wan Maisarah Damia Binti Wan Mustafa", form: 4, className: "4ANN", outstanding: 6 },

  // FORM 3
  { name: "Abdul Mubin Bin Anuaal", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Afza Nur Irdina Binti Mahadi Hassan", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Ahmad Aidil Aisyikandar Bin Ahmad Ali", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Muhammad Adam Bin Muhammad Faizal", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Muhammad Aidell Daniel Bin Rohasmady", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Muhammad Asyraf Bin Rinozamrudin", form: 3, className: "3ALI", outstanding: 33 },
  { name: "Muhammad Luqman Bin Mohammad Yusouf", form: 3, className: "3ALI", outstanding: 33 },
  { name: "Muhammad Mahdiy Bin Mohd Faiz Hakimi", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Nadhratul Humairah Binti Roslan", form: 3, className: "3IAR", outstanding: 33 },
  { name: "Nur Afrina Batrisyia Binti Mohd Zaki", form: 3, className: "3ALK", outstanding: 33 },
  { name: "Nur Aleesya Nasreen Binti Mohd Nazri", form: 3, className: "3ALK", outstanding: 27 },
  { name: "Nur Alisya Humaira Binti Mohd Nazri", form: 3, className: "3IAR", outstanding: 0 },
  { name: "Nur Fathia Raisya Binti Rahim", form: 3, className: "3ALI", outstanding: 0 },
  { name: "Nur Qisya Eryna Binti Mohd Hasan Sani", form: 3, className: "3ALA", outstanding: 0 },
  { name: "Qeisha Qurratu' Aina Binti Mohd Yusnaizi", form: 3, className: "3ALA", outstanding: 0 },
  { name: "Siti Nur Husna Binti Mohd Harman", form: 3, className: "3ALK", outstanding: 12 },
  { name: "Syafi Sumayyah Binti Azwanuddin", form: 3, className: "3IAR", outstanding: 0 },
  { name: "Syed Hasif Arsyad Bin Syed Azlan", form: 3, className: "3ALA", outstanding: 33 },
  { name: "Syed Muhammad Amsyar Bin Syed Hafeezy", form: 3, className: "3IAR", outstanding: 33 },

  // FORM 2
  { name: "Alya Syaza Mawaddah Binti Sahril", form: 2, className: "2IAR", outstanding: 27 },
  { name: "Muhammad Hafiz Adhwa Bin Mohd Hafizulaza", form: 2, className: "2IAR", outstanding: 33 },
  { name: "Muhammad Mujib Husaini Bin Mohd Rosman", form: 2, className: "2ALA", outstanding: 30 },
  { name: "Muhammad Rayyan Nur Iman Bin Muhammad Roslan", form: 2, className: "2IAR", outstanding: 3 },
  { name: "Muhammad Syauqi Hadif Zafran Bin Hafidz", form: 2, className: "2IAR", outstanding: 30 },
  { name: "Nur Rania Athirah Binti Zainul Rahman", form: 2, className: "2IAR", outstanding: 27 },
  { name: "Nurul Alya Syafiqah Binti Hasan Basri", form: 2, className: "2ALI", outstanding: 24 },
  { name: "Nurul Izzah Yamni Binti Muhammad Tarmizi", form: 2, className: "2ALI", outstanding: 0 },
  { name: "Raja Khairina Zulaikha Binti Shaffiz", form: 2, className: "2IAR", outstanding: 27 },
  { name: "Wan Auni Syazwina Binti Wan Ali", form: 2, className: "2IAR", outstanding: 0 },
  { name: "Wan Sharifah Alisha Binti Wan Saiful Anuar", form: 2, className: "2ALQ", outstanding: 27 },
];

function createPrefectId(prefect: Prefect): string {
  const slug = prefect.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `form${prefect.form}_${slug}`;
}

export async function importPrefects(): Promise<number> {
  const batch = writeBatch(db);

  prefects.forEach((prefect) => {
    const prefectId = createPrefectId(prefect);
    const prefectRef = doc(collection(db, "prefects"), prefectId);

    batch.set(prefectRef, {
      name: prefect.name,
      form: prefect.form,
      className: prefect.className,
      outstanding: prefect.outstanding,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();

  return prefects.length;
}
