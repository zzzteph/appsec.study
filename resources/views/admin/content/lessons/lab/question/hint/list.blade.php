@include('include.header')
    <section class="section">
		 	 	 		 <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('admin-view-lessons')}}">Lesson management</a></li>
            <li><a href="{{route('admin-list-lab-lesson-questions',['id'=>$question->lab_lesson->lesson->id])}}" >{{$question->lab_lesson->lesson->name}}</a></li>
		 <li><a href="{{route('admin-edit-lab-lesson-questions',['id'=>$question->lab_lesson->lesson->id,'question_id'=>$question->id])}}" >Question: {{$question->order}}</a></li>
			<li ><a href="#" >Hints</a></li>
         </ul>
      </nav>
	  <hr/>
</div>
	 <div class="container">

	
	<h1 class="title"> <a href="{{route('admin-list-lab-lesson-questions',['id'=>$question->lab_lesson->lesson_id])}}">{{$question->lab_lesson->name}} </a></h1>
			<p><a class="button is-success" href="{{route('admin-new-lab-lesson-question-hints',['question_id'=>$question->id])}}">Add hints</a></p>

<hr/>
    </div>

		 <div class="container">





@foreach ($question->hints as $hint)

 
<article class="media box ">
  <figure class="media-left">


  <p><a class="button is-small is-warning" href={{route('admin-edit-lab-lesson-question-hints',['hint_id'=>$hint->id,'question_id'=>$question->id])}}>Edit</a></p>
	
  </figure>
  <div class="media-content ">
    <div class="content">
	
      <p>
		{{$hint->hint }}
      </p>
	  <p><strong>{{$hint->price}}</strong></p>
	  <p>
	  
	  <form method="POST" action="{{route('admin-delete-lab-lesson-question-hints',['hint_id'=>$hint->id,'question_id'=>$question->id])}}">@method('DELETE')@csrf<button class="button is-small is-danger">delete</button></form>
	  
	  </p>
    </div>

  </div>
  
   <figure class="media-right">
       <form method="POST" action="{{route('admin-inc-order-lab-lesson-question-hints',['hint_id'=>$hint->id,'question_id'=>$question->id])}}">@method('PUT')@csrf<button class="button is-small is-success">+</button></form>
  <strong>{{$hint->order}}</strong>
			  			<form method="POST" action="{{route('admin-dec-order-lab-lesson-question-hints',['hint_id'=>$hint->id,'question_id'=>$question->id])}}">@method('PUT')@csrf<button class="button is-small is-danger">-</button></form>

  
  </figure>
  
</article>
   
   
@endforeach




    </div>

    </section>
@include('include.footer')