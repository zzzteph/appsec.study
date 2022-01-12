@include('include.header')

	
	 <section class="section">
		 <div class="container">

		 <div class="box is-shadowless">
		<h1 class="title">{{$lesson->lab->name}}</h1>

{!! $lesson->lab->content !!}
</div>

<div class="box is-shadowless">


	
<div class="block">
		<div class="field">
  <div class="control">
    <button class="button is-success">
	<span class="icon-text">
  <span class="icon">
  <i class="fas fa-play"></i>
  </span>
  <span>Start</span>
</span>
	
	
	
	
	
	</button>
  </div>
</div>

</div>		



</div>
	    </div>
	</section>
	
			 <section class="section">
		 <div class="container">
		 
		 <div class="icon-text is-size-5  is-align-items-center">
  <span class="icon has-text-info is-large">
    <i class="fas fa-question-circle fas fa-lg"></i>
  </span>
  <span>0 of {{$lesson->lab->questions_count}}</span>
</div>
		 
		 
				</div>


@foreach ($lesson->lab->questions as $question)
  


		 <div class="container">
			 
			 <div class="content box">


			@csrf
			<input type="hidden" name="question_id" value="{{$question->id}}">
			 <div class="field">
			  <div class="control">
				 {!! $question->question !!}
				 </div><br/>
				  <div class="control">
					<input class="input" type="text" name="answer" placeholder="Text input">
				  </div>
				</div>
				 
				<div class="field">
				  <div class="control">
					<button class="button is-success">
					<span class="icon-text">
				  <span class="icon">
					<i class="fas fa-thumbs-up"></i>
				  </span>
				  <span>Answer</span>
				</span>

					</button>
				  </div>
				</div>


		</div>

			


 
 
 
			
		</div>	
	
@endforeach

	


    </section>
	
	

	
@include('include.footer')