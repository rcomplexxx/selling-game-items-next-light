import React, { useCallback, useState } from 'react'
import styles from './emaillist.module.css'
import DatePicker from 'react-multi-date-picker';
import "react-multi-date-picker/styles/backgrounds/bg-dark.css"
import TimePicker from 'react-multi-date-picker/plugins/time_picker';

export default function EmailList({emailData, addEmail}) {

   

  return (
    <div className = {styles.emailsListDiv}>
      {emailData?.emails.map(email=>{
         return <EmailElement id={email.id} title={email.title} addEmail={addEmail}/>

      })}
      </div>
  )
}


const EmailElement= ({id, title, addEmail})=>{

  const [emailSendDate, setEmailSendDate] = useState(null);
 

  console.log('email send date', emailSendDate)

  const handleAddEmail= ()=>{
    if (!emailSendDate)return;
    console.log('email send date inside', emailSendDate)

    addEmail({id:id, title:title, sendDate:emailSendDate});



  }



  return <div className={styles.emailDiv}>
            <div className={styles.emailInfoDiv}><span>{id}</span><span>{title}</span></div>

            <DatePicker multiple={false}
            plugins={[
                <TimePicker format="HH:mm:ss" position="bottom" />
              ]}
            onChange={(date)=>{
             
              setEmailSendDate(date.unix*1000)}}
            minDate={Date.now()} 
            format="MM/DD/YYYY HH:mm:ss"  
            className={`bg-dark ${styles.datePicker}`}
    inputClass={styles.dateInput}
   />

         <button onClick={handleAddEmail}>Add email</button>
         </div>

  
}
