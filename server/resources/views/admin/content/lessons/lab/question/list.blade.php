@include('include.header')
    <section class="section">
	
	 <div class="container">

	
	<h1 class="title"> {{$lesson->name}} </h1>
			<p><a class="button is-success" href="{{route('admin-new-lab-lesson-questions',['id'=>$lesson->lesson_id])}}">Add question</a></p>

<hr/>
    </div>

		 <div class="container">





@foreach ($lesson->questions as $question)
   
 
<article class="media box ">
  <figure class="media-left">


  <span class="icon-text is-align-items-center">
  <span class="icon is-large">
  @if($question->type=="string")
    <i class="fas fa-question fa-lg"></i>
	@else
	 <i class="fas fa-meh-blank fa-lg"></i>
	@endif

  </span>
</span>

  <p><a class="button is-small is-warning" href={{route('admin-edit-lab-lesson-questions',['id'=>$lesson->lesson_id,'question_id'=>$question->id])}}>Edit</a></p>
	
  </figure>
  <div class="media-content ">
    <div class="content">
	
      <p>
					


{!! $question->question !!}
      </p>
	  <p>
	  Answer:<strong>{{$question->answer}}</strong>
	  
	  </p>
	  <p>
	  
	  <form method="POST" action="{{route('admin-delete-lab-lesson-questions',['id'=>$lesson->lesson_id,'question_id'=>$question->id])}}">@method('DELETE')@csrf<button class="button is-small is-danger">delete</button></form>
	  
	  </p>
    </div>

  </div>
  
   <figure class="media-right">
       <form method="POST" action="{{route('admin-inc-order-lab-lesson-questions',['id'=>$lesson->lesson_id,'question_id'=>$question->id])}}">@method('PUT')@csrf<button class="button is-small is-success">+</button></form>
  <strong>{{$question->order}}</strong>
			  			<form method="POST" action="{{route('admin-dec-order-lab-lesson-questions',['id'=>$lesson->lesson_id,'question_id'=>$question->id])}}">@method('PUT')@csrf<button class="button is-small is-danger">-</button></form>

  
  </figure>
  
</article>
   
   
@endforeach




    </div>

    </section>
@include('include.footer')