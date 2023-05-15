@include('include.header')
<section class="section">

   <div class="container">
   <h1 class="title">Tournaments</h1>
   
  @foreach ($tournaments as $tournament)
	@if($loop->iteration%4==0 && !$loop->first)
	</div>
	<div class="columns is-multiline">
   @endif
   @if($loop->first)
   <div class="columns is-multiline">
   @endif
   
   <div class="column is-4-desktop">

		   <div class="box">

            <h2 class="mb-2 is-size-3 is-size-4-mobile has-text-weight-bold has-text-black">  <a class="has-text-primary is-underlined" href="{{route('lessons',['topic_id' => $tournament->id])}}">{{$tournament->name}}</a></h2>
					 @if($tournament->is_tournament_archived)
       <span class="tag is-danger">Ended</span>
		@endif
				 @if($tournament->is_tournament_started)
       <span class="tag is-primary">Is running</span>
		@endif
		
						 @if($tournament->is_tournament_planned)
       <span class="tag is-primary">Planned</span>
		@endif

<br/>
			<span><small class="has-text-grey-dark">Starts: {{ $tournament->start_at }}-{{ $tournament->ends_at }}</small></span>
			

		<div class="content">
		
		<p>{{$tournament->description}}</p>
		
		</div>
			
            <table class="table is-fullwidth ">
               <tbody>
			    @if($tournament->theory_lesson_done_count!=0)
			      <tr>
                     <td>Theory</td>
                     <td>
					
						{{$tournament->theory_lesson_done_count}}
					
					 
					 </td>
                  </tr>
				   @endif
			    @if($tournament->lab_lesson_done_count!=0)
			   	<tr>
                     <td>Labs</td>
                     <td>
					
						{{$tournament->lab_lesson_done_count}}
					
					 
					 </td>
                  </tr>
				   @endif
				     @if($tournament->user_score_in_leaderboard>0)
				<tr>
                     <td>Score</td>
                     <td>
					 {{$tournament->user_score_in_leaderboard}}
					 </td>
                  </tr>  
				   @endif
				  
				  
               </tbody>
            </table>
		
			<x-topic-leaderboard :topic="$tournament" :limit="5" />
         </div>
      </div>
      @if($loop->last)
   </div>
   @endif 
   @endforeach
   </div>
</section>
@include('include.footer')